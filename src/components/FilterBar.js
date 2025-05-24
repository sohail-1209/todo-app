import React from 'react';

const FilterBar = ({
  currentFilter,
  onFilterChange,
  currentSortBy,
  onSortByChange,
  uniqueTags,
  selectedTagFilter,
  onTagFilterChange,
  searchTerm,
  onSearchChange,
  currentDateFilter,
  onDateFilterChange,
}) => {
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Created: Newest First' },
    { value: 'createdAt-asc', label: 'Created: Oldest First' },
    { value: 'text-asc', label: 'Text: A-Z' },
    { value: 'text-desc', label: 'Text: Z-A' },
    { value: 'dueDate-asc', label: 'Due Date: Soonest' },
    { value: 'dueDate-desc', label: 'Due Date: Latest' },
    { value: 'priority-desc', label: 'Priority: High to Low' },
    { value: 'priority-asc', label: 'Priority: Low to High' },
    { value: 'completed-asc', label: 'Status: Completed First' },
    { value: 'completed-desc', label: 'Status: Active First' },
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <div className="search-container">
          <input
            type="text"
            id="search-todos"
            className="search-input"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="filter-group">
        <div className="radio-group">
          <span className="filter-label">Status:</span>
          <label className="radio-option">
            <input 
              type="radio" 
              name="filter" 
              value="all" 
              checked={currentFilter === 'all'} 
              onChange={() => onFilterChange('all')} 
            />
            <span className="radio-label">All</span>
          </label>
          <label className="radio-option">
            <input 
              type="radio" 
              name="filter" 
              value="active" 
              checked={currentFilter === 'active'} 
              onChange={() => onFilterChange('active')} 
            />
            <span className="radio-label">Active</span>
          </label>
          <label className="radio-option">
            <input 
              type="radio" 
              name="filter" 
              value="completed" 
              checked={currentFilter === 'completed'} 
              onChange={() => onFilterChange('completed')} 
            />
            <span className="radio-label">Completed</span>
          </label>
        </div>
      </div>

      <div className="filter-group">
        <div className="select-container">
          <label htmlFor="sort-by" className="select-label">Sort by</label>
          <select 
            id="sort-by" 
            className="select-input"
            value={currentSortBy} 
            onChange={(e) => onSortByChange(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-group">
        <div className="select-container">
          <label htmlFor="tag-filter" className="select-label">Tag</label>
          <select 
            id="tag-filter" 
            className="select-input"
            value={selectedTagFilter} 
            onChange={(e) => onTagFilterChange(e.target.value)}
          >
            <option value="">All Tags</option>
            {uniqueTags && uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-group">
        <div className="select-container">
          <label htmlFor="date-filter" className="select-label">Date</label>
          <select 
            id="date-filter" 
            className="select-input"
            value={currentDateFilter} 
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
