"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PackageForm } from "../../../components/PackageForm";
import type { Package } from "@/lib/supabase";

export default function EditPackagePage() {
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetch(`/api/packages/${params.id}`, {
      headers: { "x-admin-token": token },
    })
      .then((res) => res.json())
      .then((data) => {
        setPkg(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/dashboard");
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!pkg) return null;

  return <PackageForm initialData={pkg} isEditing />;
}
