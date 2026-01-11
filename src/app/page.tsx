import { Container, Typography } from "@mui/material";
import { Grid } from "@mui/material";
import WorkCard from "@/components/WorkCard";
import { supabaseBrowser } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Work = {
  id: string;
  title: string;
  description: string | null;
  votes_count: number;
  tags: string[] | null;
};

async function fetchWorks(): Promise<Work[]> {
  console.log("[env check]", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "exists" : "missing",
  });
  const supa = supabaseBrowser();
  const { data, error } = await supa
    .from("works")
    .select("id,title,description,votes_count,tags")
    .order("votes_count", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function Page() {
  const works = await fetchWorks();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        成果物ギャラリー
      </Typography>

      <Grid container spacing={2}>
        {works.map((w) => (
          <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <WorkCard {...w} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
