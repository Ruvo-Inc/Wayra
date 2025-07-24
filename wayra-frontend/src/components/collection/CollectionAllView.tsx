import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  MapPinIcon,
  TruckIcon,
  HomeIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Adventure, Transportation, Lodging, Note, Checklist, User, Collection } from '../../types/adventure';
import { AdventureCard } from '../adventure/AdventureCard';
import { TransportationCard } from './TransportationCard';
import { LodgingCard } from './LodgingCard';
import { NoteCard } from './NoteCard';
import { ChecklistCard } from './ChecklistCard';

interface CollectionAllViewProps {
  adventures?: Adventure[];
  transportations?: Transportation[];
  lodging?: Lodging[];
  notes?: Note[];
  checklists?: Checklist[];
  user: User | null;
  collection: Collection;
  onEditAdventure?: (adventure: Adventure) => void;
  onDeleteAdventure?: (adventureId: string) => void;
  onEditTransportation?: (transportation: Transportation) => void;
  onDeleteTransportation?: (transportationId: string) => void;
  onEditLodging?: (lodging: Lodging) => void;
  onDeleteLodging?: (lodgingId: string) => void;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onEditChecklist?: (checklist: Checklist) => void;
  onDeleteChecklist?: (checklistId: string) => void;
}

type FilterOption = 'all' | 'adventures' | 'transportation' | 'lodging' | 'notes' | 'checklists';
type SortOption = 'name_asc' | 'name_desc' | 'date_newest' | 'date_oldest' | 'visited_first' | 'unvisited_first';

export const CollectionAllView: React.FC<CollectionAllViewProps> = ({
  adventures = [],
  transportations = [],
  lodging = [],
  notes = [],
  checklists = [],
  user,
  collection,
  onEditAdventure,
  onDeleteAdventure,
  onEditTransportation,
  onDeleteTransportation,
  onEditLodging,
  onDeleteLodging,
  onEditNote,
  onDeleteNote,
  onEditChecklist,
  onDeleteChecklist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');

  const [filteredAdventures, setFilteredAdventures] = useState<Adventure[]>([]);
  const [filteredTransportations, setFilteredTransportations] = useState<Transportation[]>([]);
  const [filteredLodging, setFilteredLodging] = useState<Lodging[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>([]);

  // Helper function to sort items
  const sortItems = <T extends any>(items: T[], sortOption: SortOption): T[] => {
    const sorted = [...items];

    switch (sortOption) {
      case 'name_asc':
        return sorted.sort((a, b) =>
          ((a as any).name || (a as any).title || '').localeCompare((b as any).name || (b as any).title || '')
        );
      case 'name_desc':
        return sorted.sort((a, b) =>
          ((b as any).name || (b as any).title || '').localeCompare((a as any).name || (a as any).title || '')
        );
      case 'date_newest':
        return sorted.sort(
          (a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime()
        );
      case 'date_oldest':
        return sorted.sort(
          (a, b) => new Date((a as any).createdAt || 0).getTime() - new Date((b as any).createdAt || 0).getTime()
        );
      case 'visited_first':
        return sorted.sort((a, b) => {
          const aVisited = (a as any).visits && (a as any).visits.length > 0;
          const bVisited = (b as any).visits && (b as any).visits.length > 0;
          if (aVisited && !bVisited) return -1;
          if (!aVisited && bVisited) return 1;
          return 0;
        });
      case 'unvisited_first':
        return sorted.sort((a, b) => {
          const aVisited = (a as any).visits && (a as any).visits.length > 0;
          const bVisited = (b as any).visits && (b as any).visits.length > 0;
          if (!aVisited && bVisited) return -1;
          if (aVisited && !bVisited) return 1;
          return 0;
        });
      default:
        return sorted;
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    // Filter adventures
    let filtered = adventures;
    if (searchQuery) {
      filtered = filtered.filter((adventure) => {
        const nameMatch = adventure.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const locationMatch = adventure.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const descriptionMatch = adventure.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        return nameMatch || locationMatch || descriptionMatch;
      });
    }
    setFilteredAdventures(sortItems(filtered, sortOption));
  }, [adventures, searchQuery, sortOption]);

  useEffect(() => {
    // Filter transportations
    let filtered = transportations;
    if (searchQuery) {
      filtered = filtered.filter((transport) => {
        const nameMatch = transport.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const fromMatch = transport.fromLocation?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const toMatch = transport.toLocation?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        return nameMatch || fromMatch || toMatch;
      });
    }
    setFilteredTransportations(sortItems(filtered, sortOption));
  }, [transportations, searchQuery, sortOption]);

  useEffect(() => {
    // Filter lodging
    let filtered = lodging;
    if (searchQuery) {
      filtered = filtered.filter((hotel) => {
        const nameMatch = hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const locationMatch = hotel.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        return nameMatch || locationMatch;
      });
    }
    setFilteredLodging(sortItems(filtered, sortOption));
  }, [lodging, searchQuery, sortOption]);

  useEffect(() => {
    // Filter notes
    let filtered = notes;
    if (searchQuery) {
      filtered = filtered.filter((note) => {
        const titleMatch = note.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const contentMatch = note.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        return titleMatch || contentMatch;
      });
    }
    setFilteredNotes(sortItems(filtered, sortOption));
  }, [notes, searchQuery, sortOption]);

  useEffect(() => {
    // Filter checklists
    let filtered = checklists;
    if (searchQuery) {
      filtered = filtered.filter((checklist) => {
        const titleMatch = checklist.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        return titleMatch;
      });
    }
    setFilteredChecklists(sortItems(filtered, sortOption));
  }, [checklists, searchQuery, sortOption]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterOption('all');
    setSortOption('name_asc');
  };

  const totalItems = filteredAdventures.length + filteredTransportations.length + filteredLodging.length + filteredNotes.length + filteredChecklists.length;

  const shouldShowSection = (sectionType: FilterOption) => {
    return filterOption === 'all' || filterOption === sectionType;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 mx-4 shadow-lg">
        {/* Header with Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <MapPinIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Collection Contents
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems} total items
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="px-3 py-2 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Adventures</div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{adventures.length}</div>
              </div>
              <div className="px-3 py-2 text-center border-l border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Transport</div>
                <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{transportations.length}</div>
              </div>
              <div className="px-3 py-2 text-center border-l border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Lodging</div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">{lodging.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {(searchQuery || filterOption !== 'all' || sortOption !== 'name_asc') && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
            <FunnelIcon className="w-3 h-3" />
            Sort:
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { key: 'name_asc', label: 'A-Z' },
              { key: 'name_desc', label: 'Z-A' },
              { key: 'date_newest', label: 'Newest First' },
              { key: 'date_oldest', label: 'Oldest First' },
              { key: 'visited_first', label: 'Visited First' },
              { key: 'unvisited_first', label: 'Unvisited First' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortOption(key as SortOption)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sortOption === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Show:</span>
          <div className="w-full overflow-x-auto">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-max sm:w-auto">
              {[
                { key: 'all', label: 'All', icon: MapPinIcon },
                { key: 'adventures', label: 'Adventures', icon: MapPinIcon },
                { key: 'transportation', label: 'Transport', icon: TruckIcon },
                { key: 'lodging', label: 'Lodging', icon: HomeIcon },
                { key: 'notes', label: 'Notes', icon: DocumentTextIcon },
                { key: 'checklists', label: 'Checklists', icon: CheckCircleIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterOption(key as FilterOption)}
                  className={`flex items-center gap-2 px-3 py-1 text-sm rounded transition-colors whitespace-nowrap ${
                    filterOption === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adventures Section */}
      {shouldShowSection('adventures') && filteredAdventures.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mx-4 mb-4">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              Linked Adventures
            </h1>
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {filteredAdventures.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-4">
            {filteredAdventures.map((adventure) => (
              <AdventureCard
                key={adventure.id}
                adventure={adventure}
                user={user}
                onEdit={onEditAdventure}
                onDelete={onDeleteAdventure}
                collection={collection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transportation Section */}
      {shouldShowSection('transportation') && filteredTransportations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mx-4 mb-4">
            <h1 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              Transportation
            </h1>
            <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
              {filteredTransportations.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-4">
            {filteredTransportations.map((transportation) => (
              <TransportationCard
                key={transportation.id}
                transportation={transportation}
                user={user}
                onEdit={onEditTransportation}
                onDelete={onDeleteTransportation}
                collection={collection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lodging Section */}
      {shouldShowSection('lodging') && filteredLodging.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mx-4 mb-4">
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
              Lodging
            </h1>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
              {filteredLodging.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-4">
            {filteredLodging.map((hotel) => (
              <LodgingCard
                key={hotel.id}
                lodging={hotel}
                user={user}
                onEdit={onEditLodging}
                onDelete={onDeleteLodging}
                collection={collection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {shouldShowSection('notes') && filteredNotes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mx-4 mb-4">
            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              Notes
            </h1>
            <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
              {filteredNotes.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                user={user}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                collection={collection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Checklists Section */}
      {shouldShowSection('checklists') && filteredChecklists.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mx-4 mb-4">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              Checklists
            </h1>
            <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
              {filteredChecklists.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-4">
            {filteredChecklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                user={user}
                onEdit={onEditChecklist}
                onDelete={onDeleteChecklist}
                collection={collection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
            <XMarkIcon className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            No Items Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            This collection doesn't contain any items yet, or your current filters don't match any items.
          </p>
          {(searchQuery || filterOption !== 'all' || sortOption !== 'name_asc') && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionAllView;
