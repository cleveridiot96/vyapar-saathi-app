
"use client";
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Users, Truck, UserCheck, Handshake, PlusCircle, List, Building, DollarSign, Search, ChevronDown, Lock, Unlock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MasterForm } from '@/components/app/masters/MasterForm';
import { MasterList } from '@/components/app/masters/MasterList';
import type { MasterItem, MasterItemType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { doesNameExist } from '@/lib/masterUtils';
import { FIXED_WAREHOUSES, FIXED_EXPENSES } from '@/lib/constants';
import { cn, debounce } from "@/lib/utils";
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { useMasters } from '@/hooks/useTransactions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from '@/hooks/useHydrated';


const FIXED_WAREHOUSE_IDS = FIXED_WAREHOUSES.map(wh => wh.id);
const FIXED_EXPENSE_IDS = FIXED_EXPENSES.map(e => e.id);
const ALL_FIXED_IDS = [...FIXED_WAREHOUSE_IDS, ...FIXED_EXPENSE_IDS];

type MasterPageTabKey = MasterItemType | 'All';

const TABS_CONFIG: { value: MasterPageTabKey; label: string; icon: React.ElementType; colorClass: string; }[] = [
  { value: "All", label: "ALL PARTIES", icon: List, colorClass: 'text-white bg-red-800 hover:bg-red-900 data-[state=active]:bg-red-900 data-[state=active]:text-white' },
  { value: "Customer", label: "CUSTOMERS", icon: Users, colorClass: 'bg-blue-500 hover:bg-blue-600 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white' },
  { value: "Broker", label: "BROKERS", icon: Handshake, colorClass: 'bg-yellow-400 hover:bg-yellow-500 text-gray-800 data-[state=active]:bg-yellow-500 data-[state=active]:text-black' },
  { value: "Supplier", label: "SUPPLIERS", icon: Truck, colorClass: 'bg-orange-500 hover:bg-orange-600 text-white data-[state=active]:bg-orange-600 data-[state=active]:text-white' },
  { value: "Agent", label: "AGENTS", icon: UserCheck, colorClass: 'bg-green-500 hover:bg-green-600 text-white data-[state=active]:bg-green-600 data-[state=active]:text-white' },
  { value: "Warehouse", label: "WAREHOUSES", icon: Building, colorClass: 'bg-teal-500 hover:bg-teal-600 text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white' },
  { value: "Transporter", label: "TRANSPORT", icon: Truck, colorClass: 'bg-[#531253] hover:bg-[#531253]/90 text-white data-[state=active]:bg-[#531253] data-[state=active]:text-white' },
  { value: "Expense", label: "EXPENSES", icon: DollarSign, colorClass: 'bg-purple-500 hover:bg-purple-600 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white' },
];

const fuseOptions = {
  keys: ['name'],
  includeScore: true,
  threshold: 0.4,
  includeMatches: true,
};

const validateMasterItem = (item: any): item is MasterItem => {
  return item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.type === 'string' && !item.name.startsWith('_DELETED_');
};

const DISPLAY_LIMIT_OPTIONS = ["50", "100", "150", "All"];

export default function MastersPage() {
  const { toast } = useToast();
  const { masterData, isMastersLoaded, addOrUpdateMaster, getAllMasters } = useMasters();
  const hydrated = useHydrated();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [activeTab, setActiveTab] = useState<MasterPageTabKey>(TABS_CONFIG[0].value);
  const [itemToDelete, setItemToDelete] = useState<MasterItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(DISPLAY_LIMIT_OPTIONS[1]);

  const allMasterItems = useMemo(() => {
    return getAllMasters().filter(validateMasterItem);
  }, [getAllMasters]);
  
  const getMasterDataStateForTab = useCallback((type: MasterPageTabKey) => {
    if (type === 'All') return allMasterItems.filter(item => !item.name.startsWith('_DELETED_')) || [];
    const data = masterData[type] || [];
    return data.filter(item => !item.name.startsWith('_DELETED_'));
  }, [allMasterItems, masterData]);
  
  const fuseInstances = useMemo(() => {
    const instances: Record<string, Fuse<MasterItem>> = {};
    TABS_CONFIG.forEach(tab => {
        const data = getMasterDataStateForTab(tab.value);
        instances[tab.value] = new Fuse((data || []).filter(validateMasterItem), fuseOptions);
    });
    return instances;
  }, [getMasterDataStateForTab]);


  const openFormForNewItem = useCallback(() => {
    setEditingItem(null);
    setIsFormOpen(true);
  }, []);

  const handleGlobalKeydown = useCallback((event: KeyboardEvent) => {
    if (event.altKey && event.key.toLowerCase() === 'n') {
        const target = event.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (isTyping) return;
        
        event.preventDefault();
        openFormForNewItem();
    }
  }, [openFormForNewItem]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [handleGlobalKeydown]);


  const debouncedSearch = useCallback(debounce((value: string) => {
    setSearchQuery(value);
  }, 200), []);

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    debouncedSearch(e.target.value);
  }

  const handleAddOrUpdateMasterItem = useCallback((item: MasterItem) => {
    if (doesNameExist(item.name, item.type, item.id, allMasterItems)) {
      toast({
        title: "Duplicate Name",
        description: `An item named "'${item.name}'" of type "${item.type}" already exists. Please use a different name.`,
        variant: "destructive",
      });
      return;
    }

    const isEditing = allMasterItems.some(i => i.id === item.id);
    addOrUpdateMaster(item);

    toast({
        title: isEditing ? `${item.type} updated` : `${item.type} added`,
        description: isEditing ? `Details for ${item.name} saved.` : `${item.name} is now in your masters.`
    });

    setIsFormOpen(false);
    setEditingItem(null);
  }, [addOrUpdateMaster, allMasterItems, toast]);

  const handleEditItem = useCallback((item: MasterItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDeleteItemAttempt = useCallback((item: MasterItem) => {
    if (item.locked || ALL_FIXED_IDS.includes(item.id)) {
      toast({
        title: "Deletion Prohibited",
        description: `${item.name} is a fixed or locked item and cannot be deleted.`,
        variant: "destructive",
      });
      return;
    }
    if (item.name.startsWith('_DELETED_')) {
      toast({
        title: "Already Deleted",
        description: `${item.name} has already been deleted.`,
        variant: "destructive",
      });
      return;
    }
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  }, [toast]);

  const confirmDeleteItem = useCallback(() => {
    if (itemToDelete) {
      addOrUpdateMaster({ ...itemToDelete, name: `_DELETED_${itemToDelete.name}_${Date.now()}`});
      toast({ title: `${itemToDelete.type} deleted`, description: `${itemToDelete.name} has been removed.`, variant: 'destructive' });
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  }, [itemToDelete, toast, addOrUpdateMaster]);

  const handleToggleLock = useCallback((item: MasterItem) => {
    addOrUpdateMaster({ ...item, locked: !item.locked });
    toast({
      title: item.locked ? "Item Unlocked" : "Item Locked",
      description: `${item.name} is now ${item.locked ? 'editable' : 'protected from edits'}.`
    });
  }, [addOrUpdateMaster, toast]);


  const addButtonLabel = useMemo(() => {
    if (activeTab === 'All') return "ADD NEW PARTY/ENTITY";
    const currentTabConfig = TABS_CONFIG.find(t => t.value === activeTab);
    const singularLabel = currentTabConfig?.label.endsWith('S') ? currentTabConfig.label.slice(0, -1) : currentTabConfig?.label;
    return `ADD NEW ${singularLabel || 'ITEM'}`.replace(/^[^\w\s]+/, '').trim();
  }, [activeTab]);

  const addButtonDynamicClass = useMemo(() => {
    if (activeTab === 'All') {
      return ''; // Default button style
    }
    const config = TABS_CONFIG.find(t => t.value === activeTab);
    if (!config) return '';

    const solidBg = config.colorClass.split(' ').find(c => /^bg-\S+/.test(c) && !c.includes(':')) || 'bg-primary';
    const textClass = config.colorClass.split(' ').find(c => /^text-\S+/.test(c) && !c.includes(':')) || 'text-primary-foreground';
    const hoverBgClass = config.colorClass.split(' ').find(c => c.startsWith('hover:bg-')) || 'hover:bg-primary/90';

    return `${solidBg} ${textClass} ${hoverBgClass}`.trim();
  }, [activeTab]);
  
  const getFilteredDataForTab = useCallback((tabValue: MasterPageTabKey) => {
    const data = getMasterDataStateForTab(tabValue).filter(validateMasterItem);
    if (!searchQuery) {
        return data.map(item => ({ item, matches: [], score: 1 }));
    }
    const fuse = fuseInstances[tabValue];
    if (!fuse) return [];
    return fuse.search(searchQuery);
  }, [getMasterDataStateForTab, fuseInstances, searchQuery]);


  if (!hydrated || !isMastersLoaded) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <p className="text-lg text-muted-foreground">Loading master data...</p>
        </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MASTERS</h1>
          <p className="text-muted-foreground text-sm">Press Alt + N to add a new item.</p>
        </div>
        <Button onClick={openFormForNewItem} size="lg" className={cn(
            "text-base py-2 px-5 shadow-md",
            addButtonDynamicClass
        )}>
            <PlusCircle className="mr-2 h-5 w-5" /> {addButtonLabel}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as MasterPageTabKey); setSearchQuery(''); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto rounded-lg overflow-hidden p-1 bg-muted gap-1">
          {TABS_CONFIG.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "py-2 text-sm font-medium flex-wrap !shadow-none data-[state=inactive]:opacity-90 transition-all rounded-md focus-visible:ring-offset-muted flex items-center justify-center",
                tab.colorClass,
                tab.value === 'Broker' && 'data-[state=active]:!text-black'
              )}
            >
              <tab.icon className="w-4 h-4 mr-1.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS_CONFIG.map(tab => {
            const filteredData = getFilteredDataForTab(tab.value);
            const totalCount = getMasterDataStateForTab(tab.value).length;
            const limit = displayLimit === 'All' ? filteredData.length : parseInt(displayLimit, 10);
            const paginatedData = filteredData.slice(0, limit);
            const tabLabelWithoutEmoji = tab.label.replace(/^[^\w\s]+/, '').trim();

            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader className="sticky top-0 bg-card z-10 py-3 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <CardTitle className="text-xl text-primary flex-shrink-0">MANAGE {tabLabelWithoutEmoji}</CardTitle>
                        <div className="flex-grow flex items-center justify-end gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-9">
                                    Show: {displayLimit} <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuRadioGroup value={displayLimit} onValueChange={setDisplayLimit}>
                                    {DISPLAY_LIMIT_OPTIONS.map(option => (
                                        <DropdownMenuRadioItem key={option} value={option}>
                                        {option}
                                        </DropdownMenuRadioItem>
                                    ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-full sm:w-auto sm:max-w-xs relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={`SEARCH IN ${tabLabelWithoutEmoji}...`}
                                    onChange={onSearchChange}
                                    className="pl-9 h-9"
                                />
                            </div>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <MasterList
                      data={paginatedData}
                      itemType={tab.value as MasterItemType | 'All'}
                      isAllItemsTab={tab.value === "All"}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItemAttempt}
                      onToggleLock={handleToggleLock}
                      fixedItemIds={ALL_FIXED_IDS}
                      searchActive={!!searchQuery}
                    />
                  </CardContent>
                  <CardFooter className="py-2">
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? `SHOWING ${paginatedData.length} OF ${filteredData.length} MATCHES (TOTAL: ${totalCount})` : `SHOWING ${paginatedData.length} OF ${totalCount} ITEMS`}
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            );
        })}
      </Tabs>

      {isFormOpen && (
        <MasterForm
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          onSubmit={handleAddOrUpdateMasterItem}
          onToggleLock={handleToggleLock}
          initialData={editingItem}
          itemTypeFromButton={editingItem ? editingItem.type : (activeTab !== 'All' ? activeTab as MasterItemType : 'Customer')}
          fixedIds={ALL_FIXED_IDS}
          allMasterItems={allMasterItems}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the master item: <strong>{itemToDelete?.name}</strong> ({itemToDelete?.type}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
    

    