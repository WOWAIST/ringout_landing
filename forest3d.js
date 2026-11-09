import * as THREE from './assets/three.module.js';
const host = document.querySelector('.forest-scene');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
try {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0,0);
  renderer.domElement.className='forest-webgl';
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(52,1,.1,100);
  scene.add(new THREE.HemisphereLight(0xfff9d9,0x6d9460,2.4));
  const sun=new THREE.DirectionalLight(0xfff3d0,3);sun.position.set(-4,9,7);scene.add(sun);
  const loader = new THREE.TextureLoader();
  const textures = ['sunleaf','pine','oak'].map(name => {
    const texture=loader.load(`./assets/garden-${name}.png`);
    texture.colorSpace=THREE.SRGBColorSpace;return texture;
  });
  // Leaves shift from green to autumn colours as --season goes 0 → 1.
  const season={value:0};
  const autumnTints=[0xe8782c,0xd4472c,0xeab23a,0xe0602a].map(hex=>new THREE.Color(hex));
  function autumnMaterial(map,tint,strength){
    const mat=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.03,side:THREE.DoubleSide,depthWrite:false});
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uSeason=season;
      shader.uniforms.uTint={value:tint};
      shader.uniforms.uStrength={value:strength};
      shader.fragmentShader='uniform float uSeason;\nuniform vec3 uTint;\nuniform float uStrength;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec3 leafCol=diffuseColor.rgb;
        float leafMask=smoothstep(.01,.12,leafCol.g-max(leafCol.r,leafCol.b));
        float leafLum=dot(leafCol,vec3(.299,.587,.114));
        // Turn yellow first, then deepen to this tree's own orange/red.
        vec3 seasonTint=mix(vec3(.86,.8,.3),uTint,smoothstep(.35,1.,uSeason));
        vec3 autumnCol=seasonTint*clamp(leafLum*2.,.3,1.35);
        diffuseColor.rgb=mix(leafCol,autumnCol,leafMask*smoothstep(0.,.6,uSeason)*uStrength);`);
    };
    return mat;
  }
  const trees=[];
  function addTree(textureIndex,tintIndex,x,y,z,scale,phase,fade){
    const geo=new THREE.PlaneGeometry(4.6,6.4,12,18);
    // Pines stay mostly evergreen; broadleaf trees turn fully.
    const mat=autumnMaterial(textures[textureIndex],autumnTints[tintIndex%autumnTints.length],textureIndex===1?.28:1);
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(x,y,z);mesh.scale.setScalar(scale);
    scene.add(mesh);
    const tree={mesh,base:new Float32Array(geo.attributes.position.array),phase,fade};
    trees.push(tree);
    return tree;
  }
  for(let row=0;row<5;row++) for(let side=0;side<2;side++) {
    const index=row*2+side;
    addTree(index%3,index,(side===0?-1:1)*(3.8+(row%2)*.4),2.0,14-row*7,1,index*.8,true);
  }
  // A distant grove behind the destination stays in view once the seed arrives.
  // xFrac is a share of the visible half-width, so the grove frames the copy at any aspect ratio.
  const grove=[
    [2,0,-.98,-34,1.15],[0,1,-.74,-30,.95],[1,2,-.56,-37,1.05],[2,3,-1.2,-29,1.1],
    [0,2,.97,-33,1.2],[2,1,.73,-30,.95],[1,0,.55,-37,1.05],[0,3,1.2,-28,1.1],
    [0,0,-.36,-41,.8],[2,2,.38,-42,.8]
  ].map(([texture,tint,xFrac,z,scale],i)=>({xFrac,scale,tree:addTree(texture,tint+i,0,0,z,scale,i*1.3,false)}));
  const endCameraZ=23-34;
  // Preserve the original mascot artwork rather than approximating its identity with primitives.
  const backTexture=loader.load('./assets/seed-back-v1.png');
  const frontTexture=loader.load('./assets/seed-front-original.png');
  backTexture.colorSpace=frontTexture.colorSpace=THREE.SRGBColorSpace;
  const seedMaterial=new THREE.SpriteMaterial({map:backTexture,transparent:true,depthTest:false});
  const seed=new THREE.Sprite(seedMaterial);seed.scale.set(1.5,1.5,1);seed.renderOrder=20;scene.add(seed);
  // "도착!" bubble that rides above the seed while it hops at the destination.
  const arrivalBubble=document.createElement('div');
  arrivalBubble.className='seed-arrival-bubble';arrivalBubble.textContent='도착!';arrivalBubble.setAttribute('aria-hidden','true');
  host.append(arrivalBubble);
  const bubbleAnchor=new THREE.Vector3();
  let visible=false,frame;
  function resize(){
    renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
    const halfWidthPerDepth=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
    // Narrow screens get a smaller grove so it never covers the headline.
    const groveSize=camera.aspect<1?.55:1;
    for(const {xFrac,scale,tree} of grove){
      const size=scale*groveSize;
      tree.mesh.scale.setScalar(size);
      tree.mesh.position.x=xFrac*halfWidthPerDepth*(endCameraZ-tree.mesh.position.z);
      tree.mesh.position.y=-1.8+3.2*size; // keep every trunk on the same ground line
    }
    draw(performance.now(),false);
  }
  function draw(time,loop=true){
    const entranceStyle=document.querySelector('.entrance').style;
    const p=Number(entranceStyle.getPropertyValue('--travel'))||0;
    season.value=Number(entranceStyle.getPropertyValue('--season'))||0;
    camera.position.set(0,2.2,23-p*34);camera.lookAt(0,2.25,camera.position.z-15);
    const t=motion.matches?0:time/1000;
    for(const tree of trees) {
      const pos=tree.mesh.geometry.attributes.position;
      for(let i=0;i<pos.count;i++) {
        const y=tree.base[i*3+1];
        const crown=Math.max(0,(y+1.9)/5.1);
        pos.array[i*3]=tree.base[i*3]+(motion.matches?0:Math.sin(t*1.6+tree.phase+y*.65)*.12*crown*crown);
      }
      pos.needsUpdate=true;
      if(tree.fade) tree.mesh.material.opacity=Math.max(0,Math.min(1,(.84-p)*6));
    }
    const traveling=p>.02&&p<.94;
    const arrived=p>=.94;
    seed.visible=traveling||arrived;
    const walk=motion.matches?0:Math.sin(t*8)*.035;
    const hop=motion.matches?0:Math.abs(Math.sin(t*5.5))*.35;
    seed.position.set(arrived?-1.05:Math.sin(p*7)*.2,arrived?.6+hop:.5+Math.abs(walk),camera.position.z-5.5);
    seedMaterial.map=arrived?frontTexture:backTexture;
    seedMaterial.rotation=arrived?Math.sin(t*5.5)*.06:walk;
    // Both source assets are square. Preserve their aspect ratio across the turn.
    seed.scale.set(1.45,1.45,1);

    arrivalBubble.classList.toggle('is-visible',arrived);
    if(arrived){
      bubbleAnchor.set(seed.position.x,seed.position.y+seed.scale.y*.5,seed.position.z).project(camera);
      arrivalBubble.style.left=`${(bubbleAnchor.x+1)/2*host.clientWidth}px`;
      arrivalBubble.style.top=`${(1-bubbleAnchor.y)/2*host.clientHeight}px`;
    }
    renderer.render(scene,camera);
    if(loop&&visible&&!document.hidden) frame=requestAnimationFrame(draw);
  }
  function sync(){cancelAnimationFrame(frame);if(visible&&!document.hidden){if(motion.matches)draw(0,false);else frame=requestAnimationFrame(draw);}}
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();}).observe(host);
  addEventListener('resize',resize);addEventListener('scroll',()=>{if(motion.matches&&visible)draw(0,false);},{passive:true});
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  renderer.domElement.addEventListener('webglcontextlost',()=>host.classList.remove('has-webgl'));
  resize();host.classList.add('has-webgl');
}catch(error){console.warn('3D forest unavailable; using tree image fallback.',error);}
