import { Container, Typography } from "@mui/material";
import { Grid } from "@mui/material";
import WorkCard from "@/components/WorkCard";
import { getGalleryWorks, galleryBackend } from "@/lib/gallery-store";
import type { Work } from "@/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  let works: Work[] = [];
  let errorMessage: string | null = null;

  try {
    works = await getGalleryWorks();
  } catch (error) {
    console.error("Failed to load gallery works", error);
    errorMessage = "作品データの取得に失敗しました。設定を確認してください。";
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        成果物ギャラリー
      </Typography>

      {galleryBackend() === "sqlite" && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>ローカルSQLite・学習用（2025年の復旧データの作業コピー）</Typography>
      )}
      {errorMessage ? (
        <Typography color="error">{errorMessage}</Typography>
      ) : works.length === 0 ? (
        <Typography color="text.secondary">
          作品データがまだ登録されていません。
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {works.map((w) => (
            <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <WorkCard {...w} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
