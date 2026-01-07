import CategoryManager from '@/components/admin/settings/CategoryManager'

export default function CategoriesSettingsPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">종별/부서 관리</h1>
            <CategoryManager />
        </div>
    )
}
