"use client";

import { useParams } from "next/navigation";
import TemaDetalle from "@/components/TemaDetalle";

export default function TemaPageClient() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  return <TemaDetalle id={id} />;
}