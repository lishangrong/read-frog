import SelectionFloatingButton from './components/selection-floating-button'
import FloatingButton from './components/floating-button'
import SideContent from './components/side-content'

export default function App() {
  return (
    <div className="text-black dark:text-white">
      <FloatingButton />
      <SideContent />
      <SelectionFloatingButton />
    </div>
  )
}
