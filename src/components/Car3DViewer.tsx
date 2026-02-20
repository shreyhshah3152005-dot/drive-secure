import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Box, RotateCcw, Palette, Eye } from "lucide-react";
import * as THREE from "three";

interface Car3DViewerProps {
  carName: string;
  carBrand: string;
}

const CAR_COLORS = [
  { name: "Midnight Black", color: "#1a1a2e" },
  { name: "Pearl White", color: "#f0ece2" },
  { name: "Racing Red", color: "#c0392b" },
  { name: "Ocean Blue", color: "#2980b9" },
  { name: "Forest Green", color: "#27ae60" },
  { name: "Sunset Gold", color: "#f39c12" },
  { name: "Silver", color: "#bdc3c7" },
  { name: "Deep Purple", color: "#8e44ad" },
];

function CarBody({ color, bodyStyle }: { color: string; bodyStyle: string }) {
  const meshRef = useRef<THREE.Group>(null);

  const isSUV = bodyStyle === "suv";
  const isSedan = bodyStyle === "sedan";

  return (
    <group ref={meshRef} position={[0, 0.05, 0]}>
      {/* Main body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[3.8, 0.6, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0.2, isSUV ? 1.05 : 0.95, 0]} castShadow>
        <boxGeometry args={[isSUV ? 2.4 : 2.0, isSUV ? 0.65 : 0.5, 1.45]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield front */}
      <mesh position={[-0.7, isSUV ? 0.85 : 0.78, 0]} rotation={[0, 0, Math.PI * 0.12]}>
        <boxGeometry args={[0.6, isSUV ? 0.55 : 0.45, 1.4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.05} transparent opacity={0.4} />
      </mesh>

      {/* Windshield rear */}
      <mesh position={[1.15, isSUV ? 0.85 : 0.78, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
        <boxGeometry args={[0.5, isSUV ? 0.5 : 0.4, 1.4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.05} transparent opacity={0.4} />
      </mesh>

      {/* Side windows left */}
      <mesh position={[0.2, isSUV ? 0.95 : 0.85, 0.76]}>
        <boxGeometry args={[1.6, isSUV ? 0.4 : 0.3, 0.05]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.05} transparent opacity={0.35} />
      </mesh>

      {/* Side windows right */}
      <mesh position={[0.2, isSUV ? 0.95 : 0.85, -0.76]}>
        <boxGeometry args={[1.6, isSUV ? 0.4 : 0.3, 0.05]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.1} roughness={0.05} transparent opacity={0.35} />
      </mesh>

      {/* Hood slope */}
      <mesh position={[-1.4, 0.55, 0]} rotation={[0, 0, Math.PI * 0.04]}>
        <boxGeometry args={[1.0, 0.15, 1.55]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Trunk */}
      <mesh position={[1.5, isSedan ? 0.55 : 0.5, 0]}>
        <boxGeometry args={[0.8, isSedan ? 0.15 : 0.4, 1.55]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[-1.95, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.35, 1.65]} />
        <meshStandardMaterial color="#2c2c2c" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[1.95, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.35, 1.65]} />
        <meshStandardMaterial color="#2c2c2c" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-1.92, 0.5, 0.55]}>
        <boxGeometry args={[0.08, 0.15, 0.35]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-1.92, 0.5, -0.55]}>
        <boxGeometry args={[0.08, 0.15, 0.35]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={0.5} />
      </mesh>

      {/* Taillights */}
      <mesh position={[1.92, 0.5, 0.55]}>
        <boxGeometry args={[0.08, 0.12, 0.3]} />
        <meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.92, 0.5, -0.55]}>
        <boxGeometry args={[0.08, 0.12, 0.3]} />
        <meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>

      {/* Grille */}
      <mesh position={[-1.93, 0.42, 0]}>
        <boxGeometry args={[0.05, 0.2, 0.8]} />
        <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-1.1, 0.18, 0.85]} />
      <Wheel position={[-1.1, 0.18, -0.85]} />
      <Wheel position={[1.1, 0.18, 0.85]} />
      <Wheel position={[1.1, 0.18, -0.85]} />

      {/* Side skirts */}
      <mesh position={[0, 0.12, 0.82]}>
        <boxGeometry args={[3.4, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.12, -0.82]}>
        <boxGeometry args={[3.4, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Door lines left */}
      <mesh position={[-0.2, 0.5, 0.805]}>
        <boxGeometry args={[0.02, 0.5, 0.01]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.6, 0.5, 0.805]}>
        <boxGeometry args={[0.02, 0.5, 0.01]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Door lines right */}
      <mesh position={[-0.2, 0.5, -0.805]}>
        <boxGeometry args={[0.02, 0.5, 0.01]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.6, 0.5, -0.805]}>
        <boxGeometry args={[0.02, 0.5, 0.01]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Side mirrors */}
      <mesh position={[-0.5, 0.8, 0.9]}>
        <boxGeometry args={[0.15, 0.08, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.5, 0.8, -0.9]}>
        <boxGeometry args={[0.15, 0.08, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Roof rails (SUV) */}
      {isSUV && (
        <>
          <mesh position={[0.2, 1.4, 0.7]}>
            <boxGeometry args={[2.2, 0.04, 0.04]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.2, 1.4, -0.7]}>
            <boxGeometry args={[2.2, 0.04, 0.04]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Wheel({ position }: { position: [number, number, number] }) {
  const wheelRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Tire */}
      <mesh ref={wheelRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.08, 8, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshStandardMaterial color="#e8e8e8" metalness={0.1} roughness={0.8} />
    </mesh>
  );
}

function AutoRotate({ enabled }: { enabled: boolean }) {
  const controlsRef = useRef<any>(null);
  useFrame((_, delta) => {
    if (enabled && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 2;
      controlsRef.current.update();
    }
  });
  return null;
}

const Car3DViewer = ({ carName, carBrand }: Car3DViewerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0].color);
  const [autoRotate, setAutoRotate] = useState(true);
  const [bodyStyle, setBodyStyle] = useState<string>("sedan");

  const detectBodyStyle = () => {
    const name = `${carBrand} ${carName}`.toLowerCase();
    if (name.includes("suv") || name.includes("thar") || name.includes("fortuner") || name.includes("creta") || name.includes("seltos") || name.includes("xuv") || name.includes("harrier") || name.includes("safari") || name.includes("scorpio")) return "suv";
    return "sedan";
  };

  const handleOpen = (open: boolean) => {
    if (open) {
      setBodyStyle(detectBodyStyle());
    }
    setDialogOpen(open);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Box className="h-4 w-4" />
          3D View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            3D Model: {carBrand} {carName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-gradient-to-b from-muted/30 to-muted/60">
          <Canvas
            shadows
            camera={{ position: [4, 3, 4], fov: 45 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[-3, 4, -3]} intensity={0.4} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />

            <Suspense fallback={
              <Html center>
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
                </div>
              </Html>
            }>
              <CarBody color={selectedColor} bodyStyle={bodyStyle} />
              <Floor />
              <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2} />
              <Environment preset="studio" />
            </Suspense>

            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          </Canvas>

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={autoRotate ? "default" : "outline"}
                onClick={() => setAutoRotate(!autoRotate)}
                className="gap-1 backdrop-blur-sm"
              >
                <RotateCcw className="h-3 w-3" />
                {autoRotate ? "Stop" : "Rotate"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground backdrop-blur-sm bg-background/60 px-2 py-1 rounded">
              Drag to rotate • Scroll to zoom
            </div>
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Exterior Color</span>
            <span className="text-xs text-muted-foreground">
              — {CAR_COLORS.find(c => c.color === selectedColor)?.name}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CAR_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => setSelectedColor(c.color)}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  selectedColor === c.color ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border"
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Interactive 3D</Badge>
          <Badge variant="secondary">Color Customization</Badge>
          <Badge variant="secondary">360° View</Badge>
          <Badge variant="secondary">Auto Rotate</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Car3DViewer;
