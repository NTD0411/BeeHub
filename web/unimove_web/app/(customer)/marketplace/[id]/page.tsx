import { redirect } from 'next/navigation'

export default function MarketplaceDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/cho-sinh-vien/${params.id}`)
}
