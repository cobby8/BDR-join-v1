import TournamentForm from '../TournamentForm'

export default function CreateTournamentPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">새 대회 만들기</h1>
            <div className="w-full">
                <TournamentForm />
            </div>
        </div>
    )
}
