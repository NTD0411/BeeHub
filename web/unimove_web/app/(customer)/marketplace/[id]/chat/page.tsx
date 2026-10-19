import { redirect } from 'next/navigation'

export default function MarketplaceChatRedirect({ params }: { params: { id: string } }) {
  redirect(`/tin-nhan?listingId=${params.id}`)
}
