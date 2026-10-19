import "server-only";
import { resolve } from "node:path";
import { WorksSchema } from "@/schemas";
import { listSqliteWorks, voteSqlite } from "./sqlite-store";
import { supabaseServerAdmin, supabaseServerPublic } from "./supabaseServer";

export function galleryBackend(): "sqlite" | "supabase" {
  const backend = process.env.GALLERY_DATABASE ?? "supabase";
  if (backend !== "sqlite" && backend !== "supabase") throw new Error("Unsupported gallery database");
  return backend;
}

function sqlitePath(): string {
  return resolve(process.env.GALLERY_SQLITE_PATH ?? "data/gallery.sqlite");
}

export async function getGalleryWorks() {
  if (galleryBackend() === "sqlite") return WorksSchema.parse(listSqliteWorks(sqlitePath()));
  const { data, error } = await supabaseServerPublic().from("works").select("id,title,description,votes_count,tags").order("votes_count", { ascending: false });
  if (error) throw error;
  return WorksSchema.parse(data ?? []);
}

export async function voteForWork(workId: string): Promise<number | null> {
  if (galleryBackend() === "sqlite") return voteSqlite(sqlitePath(), workId);
  const supa = supabaseServerAdmin();
  const { error } = await supa.from("vote_events").insert({ work_id: workId });
  if (error) throw error;
  const { data, error: readError } = await supa.from("works").select("votes_count").eq("id", workId).single();
  if (readError) throw readError;
  return data.votes_count;
}
