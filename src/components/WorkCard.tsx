'use client';

import * as React from 'react';
import {
  Card, CardHeader, CardContent, CardActions,
  Typography, Button, Chip, Stack
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

type Props = {
  id: string;
  title: string;
  description?: string | null;
  votes_count: number;
  tags?: string[] | null;
};

export default function WorkCard({ id, title, description, votes_count, tags }: Props) {
  const [count, setCount] = React.useState(votes_count);
  const [loading, setLoading] = React.useState(false);

  const vote = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'vote failed');
      if (typeof json.votesCount === 'number') setCount(json.votesCount);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'vote failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {description || '説明はありません'}
        </Typography>
        {!!tags?.length && (
          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
            {tags!.map((t) => <Chip key={t} size="small" label={t} />)}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Typography variant="body2">Votes: <b>{count}</b></Typography>
        <Button
          startIcon={<ThumbUpIcon />}
          variant="contained"
          onClick={vote}
          disabled={loading}
        >
          投票
        </Button>
      </CardActions>
    </Card>
  );
}