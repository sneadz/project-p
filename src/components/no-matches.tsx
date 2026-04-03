import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function NoMatches() {
  return (
    <div className="py-20 text-center rounded-2xl border border-dashed border-primary/20 bg-card/10">
      <Trophy className="h-12 w-12 text-muted/20 mx-auto mb-4" />
      <p className="text-muted-foreground font-medium">
        Aucun match n&apos;est encore programmé pour cette série.
      </p>
      <Link href="/">
        <Button variant="outline" className="mt-6">
          Explorer d&apos;autres tournois
        </Button>
      </Link>
    </div>
  )
}
