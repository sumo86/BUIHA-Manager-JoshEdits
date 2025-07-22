import { useState } from 'react';
import { useTeam, TierInfo } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { CreateDivisionDialog } from '../dialogs/CreateDivisionDialog';
import { v4 as uuidv4 } from 'uuid';

const SortableTierItem = ({ tier, onRename }: { tier: TierInfo, onRename: (tier: TierInfo) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tier.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center bg-background border rounded-lg p-3 space-x-4">
            <button {...listeners} className="cursor-grab touch-none p-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <span className="flex-grow font-medium">{tier.name}</span>
            <Button variant="ghost" size="icon" onClick={() => onRename(tier)}>
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    );
};

const TierManager = () => {
    const { tierHierarchy, updateTierHierarchy } = useTeam();
    const [activeTiers, setActiveTiers] = useState<TierInfo[]>(tierHierarchy);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [tierToRename, setTierToRename] = useState<TierInfo | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setActiveTiers((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveChanges = () => {
        updateTierHierarchy(activeTiers);
        toast.success("League hierarchy has been saved.");
    };

    const handleAddTier = (name: string) => {
        const newTier: TierInfo = { id: uuidv4(), name };
        setActiveTiers(prev => [...prev, newTier]);
    };

    const handleRenameTier = (newName: string) => {
        if (!tierToRename) return;
        setActiveTiers(prev => prev.map(t => t.id === tierToRename.id ? { ...t, name: newName } : t));
        setTierToRename(null);
    };

    const openRenameDialog = (tier: TierInfo) => {
        setTierToRename(tier);
        setIsRenameDialogOpen(true);
    };

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-2">Tier Hierarchy</h2>
            <p className="text-muted-foreground mb-4">Drag and drop tiers to change their rank. The top is Rank 1. Changes will affect promotions, relegations, and player star ratings.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTiers} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {activeTiers.map(tier => (
                            <SortableTierItem key={tier.id} tier={tier} onRename={openRenameDialog} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>Add New Tier</Button>
                <Button onClick={handleSaveChanges}>Save Hierarchy</Button>
            </div>

            <CreateDivisionDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onCreate={handleAddTier}
                title="Add New Tier"
                description="Enter the name for the new tier (e.g., Checking 3). It will be added to the bottom of the hierarchy."
                label="Tier Name"
                placeholder="e.g., Checking 3"
            />
            {tierToRename && (
                 <CreateDivisionDialog
                    isOpen={isRenameDialogOpen}
                    onClose={() => setIsRenameDialogOpen(false)}
                    onCreate={handleRenameTier}
                    title={`Rename Tier: ${tierToRename.name}`}
                    description="Enter the new name for this tier."
                    label="New Name"
                    placeholder={tierToRename.name}
                />
            )}
        </div>
    );
};

export default TierManager;