import Sidebar from '@/components/admin/Sidebar'
import LogoutButton from './LogoutButton'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <Sidebar>
                <div className="pt-4 border-t border-gray-100">
                    <LogoutButton />
                </div>
            </Sidebar>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
