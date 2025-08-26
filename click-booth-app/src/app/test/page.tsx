import { BoxesCore } from "@/components/ui/background-boxes";

export default function page() {
  return (
    <div className="relative h-screen bg-gray-100">
      <BoxesCore className="absolute inset-0 z-10 opacity-50" />
      <div className="relative z-20 text-center pt-20">
        <h1 className="text-4xl font-bold">Testing BoxesCore</h1>
      </div>
    </div>
  );
}
