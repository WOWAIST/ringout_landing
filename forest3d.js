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
  const trees=[];
  for(let row=0;row<5;row++) for(let side=0;side<2;side++) {
    const index=row*2+side;
    const geo=new THREE.PlaneGeometry(4.6,6.4,12,18);
    const mat=new THREE.MeshBasicMaterial({map:textures[index%3],transparent:true,alphaTest:.03,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set((side===0?-1:1)*(3.8+(row%2)*.4),2.0,14-row*7);
    scene.add(mesh);
    trees.push({mesh,base:new Float32Array(geo.attributes.position.array),phase:index*.8});
  }
  // Preserve the original mascot artwork rather than approximating its identity with primitives.
  const backTexture=loader.load('./assets/seed-back-v1.png');
  const frontTexture=loader.load('./assets/seed-front-original.png');
  backTexture.colorSpace=frontTexture.colorSpace=THREE.SRGBColorSpace;
  const seedMaterial=new THREE.SpriteMaterial({map:backTexture,transparent:true,depthTest:false});
  const seed=new THREE.Sprite(seedMaterial);seed.scale.set(1.5,1.5,1);seed.renderOrder=20;scene.add(seed);
  let visible=false,frame;
  function resize(){renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();draw(performance.now(),false);}
  function draw(time,loop=true){
    const p=Number(document.querySelector('.entrance').style.getPropertyValue('--travel'))||0;
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
      tree.mesh.material.opacity=Math.max(0,Math.min(1,(.84-p)*6));
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
