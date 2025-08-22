import { z } from "zod";

// DBから読み込む作品（必要最低限）
export const WorkSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  votes_count: z.number().int(),
  tags: z.array(z.string()).nullable().optional(),
});
export const WorksSchema = z.array(WorkSchema);
export type Work = z.infer<typeof WorkSchema>;

// 投票APIの入力
export const VoteBodySchema = z.object({
  workId: z.uuid(),
  fingerprint: z.string().optional(),
});