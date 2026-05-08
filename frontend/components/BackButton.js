import { useRouter } from "next/router";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      className="universal-back-button"
      onClick={() => router.back()}
    >
      ← Voltar
    </button>
  );
}