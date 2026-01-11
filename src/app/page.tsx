import { Container, Typography } from '@mui/material';
import { Grid } from '@mui/material';
import WorkCard from '@/components/WorkCard';
import { supabaseServerPublic } from '@/lib/supabaseClient';

export const dynamic = "force-dynamic";

type Work = {
  id: string;
  title: string;
  description: string | null;
  votes_count: number;
  tags: string[] | null;
};

async function fetchWorks(): Promise<Work[]> {
  const supa = supabaseServerPublic();
  const { data, error } = await supa
    .from('works')
    .select('id,title,description,votes_count,tags')
    .order('votes_count', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function Page() {
  let works: Work[] = [];
  let errorMessage: string | null = null;

  try {
    works = await fetchWorks();
  } catch (error) {
    console.error('Failed to load works from Supabase', error);
    errorMessage = '作品データの取得に失敗しました。設定を確認してください。';
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        成果物ギャラリー
      </Typography>

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