import { GeneratorModal } from '@/components/GeneratorModal';
import { useNavigate } from 'react-router-dom';

export default function StudioPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090E] pt-24 pb-16 px-4">
      <GeneratorModal
        isOpen={true}
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
