import { supabase } from "@/lib/supabase";

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  filePath: string;
  weekReference: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string | null;
}

interface LessonRow {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  week_reference: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string | null;
}

function rowToLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    filePath: row.file_path,
    weekReference: row.week_reference,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("week_reference", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "[lessonsData] erro ao buscar lições:",
      error,
    );

    throw error;
  }

  return (data ?? []).map((row) =>
    rowToLesson(row as LessonRow),
  );
}

export async function getLessonPdfUrl(
  filePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("lessons")
    .createSignedUrl(filePath, 60 * 60);

  if (error) {
    console.error(
      "[lessonsData] erro ao gerar URL do PDF:",
      error,
    );

    return null;
  }

  return data.signedUrl;
}

export async function createLesson(input: {
  title: string;
  description: string;
  weekReference: string;
  file: File;
  uploadedBy: string;
}): Promise<Lesson> {
  const fileExtension =
    input.file.name.split(".").pop()?.toLowerCase() ?? "pdf";

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

  const filePath = fileName;

  // 1. Envia o PDF para o Storage
  const { error: uploadError } = await supabase.storage
    .from("lessons")
    .upload(filePath, input.file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "[lessonsData] erro ao enviar PDF:",
      uploadError,
    );

    throw uploadError;
  }

  // 2. Cria o registro da lição
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      title: input.title,
      description: input.description || null,
      file_path: filePath,
      week_reference: input.weekReference || null,
      uploaded_by: input.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "[lessonsData] erro ao criar lição:",
      error,
    );

    // Remove o PDF caso o registro da lição falhe
    await supabase.storage
      .from("lessons")
      .remove([filePath]);

    throw error;
  }

  return rowToLesson(data as LessonRow);
}