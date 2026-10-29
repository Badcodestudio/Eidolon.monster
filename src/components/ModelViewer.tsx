import { Component, Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

class ViewerBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Interactive 3D viewer: drag to rotate, pinch or scroll to zoom. Falls back to the picture if the file can't load. */
export default function ModelViewer({ url, fallback, spin = true, speed = 1.2 }: { url: string; fallback: ReactNode; spin?: boolean; speed?: number }) {
  return (
    <ViewerBoundary fallback={fallback}>
      <Canvas camera={{ position: [0, 0.4, 3], fov: 40 }} dpr={[1, 2]} style={{ touchAction: 'none' }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2.4} />
        <directionalLight position={[-4, 2, -3]} intensity={1.1} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.25}>
            <Model url={url} />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault autoRotate={spin} autoRotateSpeed={speed} enableDamping />
      </Canvas>
    </ViewerBoundary>
  );
}
