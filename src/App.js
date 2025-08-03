import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Helper Functions & Hooks ---

// Simple UUID generator for unique keys
const uuid = () => `id_${Math.random().toString(36).substr(2, 9)}`;

// Default state values for reset functionality
const defaultPeople = [
    {id: uuid(), name: 'Alice'}, {id: uuid(), name: 'Bob'}, {id: uuid(), name: 'Charlie'},
    {id: uuid(), name: 'Dana'}, {id: uuid(), name: 'Eve'}, {id: uuid(), name: 'Frank'},
    {id: uuid(), name: 'Grace'}, {id: uuid(), name: 'Heidi'}
];
const defaultCars = [
    {id: uuid(), name: 'Sedan', capacity: 4},
    {id: uuid(), name: 'Coupe', capacity: 2},
    {id: uuid(), name: 'SUV', capacity: 5},
];

// Custom hook to persist state in localStorage
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
}

const RULE_TYPES = {
  TOGETHER: 'together',
  SEPARATE: 'separate',
  SPECIFIC_CAR: 'specificCar',
};

const RULE_DESCRIPTIONS = {
  [RULE_TYPES.TOGETHER]: 'Must travel together',
  [RULE_TYPES.SEPARATE]: 'Cannot travel together',
  [RULE_TYPES.SPECIFIC_CAR]: 'Must be in a specific car',
};

// --- UI Components ---

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;


const Input = ({ className = '', ...props }) => (
  <input className={`w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 transition ${className}`} {...props} />
);

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseClasses = "px-4 py-2 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-400',
  };
  return <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const ListManager = ({ title, items, setItems, placeholder, type, totalSeats }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemValue, setNewItemValue] = useState(type === 'car' ? '4' : '');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = type === 'car'
      ? { id: uuid(), name: newItemName.trim(), capacity: parseInt(newItemValue, 10) || 1 }
      : { id: uuid(), name: newItemName.trim() };
    setItems([...items, newItem]);
    setNewItemName('');
    if (type === 'car') setNewItemValue('4');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex justify-between items-center">
        <span>{title}</span>
        <span className="bg-gray-500 dark:bg-gray-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">{items.length}</span>
      </h2>
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <Input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={placeholder} />
        {type === 'car' && <Input type="number" value={newItemValue} onChange={(e) => setNewItemValue(e.target.value)} min="1" className="w-24" placeholder="Seats" />}
        <Button type="submit" variant="primary"><PlusIcon /></Button>
      </form>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
            <span className="text-gray-800 dark:text-white">{item.name}{type === 'car' && ` (${item.capacity} seats)`}</span>
            <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"><TrashIcon /></button>
          </li>
        ))}
      </ul>
      {type === 'car' && totalSeats !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-300 font-semibold">Total Seats Available: <span className="text-gray-800 dark:text-gray-100">{totalSeats}</span></p>
          </div>
      )}
    </div>
  );
};

const RuleBuilder = ({ rules, setRules, people, cars, lastRuleType, setLastRuleType, setGlobalError }) => {
  const [ruleType, setRuleType] = useState(lastRuleType);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(cars.length > 0 ? cars[0].id : '');

  useEffect(() => {
    setRuleType(lastRuleType);
    setSelectedPeople([]);
    if (cars.length > 0 && !cars.some(c => c.id === selectedCarId)) {
        setSelectedCarId(cars[0].id);
    } else if (cars.length === 0) {
        setSelectedCarId('');
    }
  }, [lastRuleType, cars]);

  const handleAddRule = () => {
    let newRule = { id: uuid(), type: ruleType };
    let isValid = false;
    setGlobalError('');

    const checkDuplicate = (rule) => rules.some(existingRule => JSON.stringify(Object.entries(existingRule).sort()) === JSON.stringify(Object.entries(rule).sort()));
    const checkImpossible = (rule) => {
        if (rule.type === RULE_TYPES.SPECIFIC_CAR && rules.some(r => r.type === RULE_TYPES.SPECIFIC_CAR && r.person === rule.person)) {
            setGlobalError(`${rule.person} is already assigned to a specific car.`); return true;
        }
        if (rule.type === RULE_TYPES.SEPARATE && rules.some(r => r.type === RULE_TYPES.TOGETHER && r.people.includes(rule.people[0]) && r.people.includes(rule.people[1]))) {
            setGlobalError(`Cannot separate ${rule.people.join(' and ')} because a rule keeps them together.`); return true;
        }
        if (rule.type === RULE_TYPES.TOGETHER) {
            for(let i = 0; i < rule.people.length; i++) {
                for(let j = i + 1; j < rule.people.length; j++) {
                    const pair = [rule.people[i], rule.people[j]];
                    if(rules.some(r => r.type === RULE_TYPES.SEPARATE && r.people.includes(pair[0]) && r.people.includes(pair[1]))) {
                        setGlobalError(`Cannot force ${pair.join(' and ')} together because a rule separates them.`); return true;
                    }
                }
            }
        }
        return false;
    };

    switch (ruleType) {
      case RULE_TYPES.TOGETHER: if (selectedPeople.length > 1) { newRule.people = selectedPeople.sort(); isValid = true; } break;
      case RULE_TYPES.SEPARATE: if (selectedPeople.length === 2) { newRule.people = selectedPeople.sort(); isValid = true; } break;
      case RULE_TYPES.SPECIFIC_CAR: if (selectedPeople.length === 1 && selectedCarId) { newRule.person = selectedPeople[0]; newRule.carId = selectedCarId; isValid = true; } break;
      default: break;
    }

    if (isValid) {
      if (checkDuplicate(newRule)) { setGlobalError("This exact rule already exists."); return; }
      if (checkImpossible(newRule)) { return; }
      setRules([...rules, newRule]);
      setLastRuleType(ruleType);
      setSelectedPeople([]);
    } else {
      setGlobalError("Please ensure you've selected the correct number of people/cars for this rule.");
    }
  };
  
  const getRuleText = (rule) => {
    const peopleNames = (rule.people || (rule.person ? [rule.person] : [])).join(', ');
    const carName = rule.carId ? (cars.find(c => c.id === rule.carId)?.name || 'Unknown Car') : '';
    switch(rule.type) {
        case RULE_TYPES.TOGETHER: return `${peopleNames} must travel together.`;
        case RULE_TYPES.SEPARATE: return `${peopleNames} must travel separately.`;
        case RULE_TYPES.SPECIFIC_CAR: return `${rule.person} must be in ${carName}.`;
        default: return 'Unknown rule';
    }
  };

  const renderRuleInput = () => {
    const personOptions = people.map(p => p.name);
    return (
        <>
            {ruleType === RULE_TYPES.TOGETHER && <MultiSelect label="Select 2 or more people:" options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} />}
            {ruleType === RULE_TYPES.SEPARATE && <MultiSelect label="Select exactly 2 people:" options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} max={2}/>}
            {ruleType === RULE_TYPES.SPECIFIC_CAR && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MultiSelect label="Select 1 person:" options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} max={1}/>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select car:</label>
                        <select value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)} className="mt-1 w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400" disabled={cars.length === 0}>
                            {cars.length > 0 ? cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Add a car first</option>}
                        </select>
                    </div>
                </div>
            )}
        </>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 md:col-span-2">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex justify-between items-center">
        <span>Rules</span>
        <span className="bg-gray-500 dark:bg-gray-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">{rules.length}</span>
      </h2>
      <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md mb-6">
        <label htmlFor="rule-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Type</label>
        <select id="rule-type" value={ruleType} onChange={e => setRuleType(e.target.value)} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 mb-4">
          {Object.entries(RULE_DESCRIPTIONS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
        </select>
        {renderRuleInput()}
        <Button onClick={handleAddRule} className="mt-4 w-full md:w-auto" disabled={people.length === 0}>
          <PlusIcon /> Add Rule
        </Button>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Rules:</h3>
      <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {rules.length > 0 ? rules.map(rule => (
          <li key={rule.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
            <span className="text-gray-800 dark:text-white text-sm">{getRuleText(rule)}</span>
            <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"><TrashIcon /></button>
          </li>
        )) : <p className="text-gray-500 dark:text-gray-400">No rules defined yet.</p>}
      </ul>
    </div>
  );
};

const MultiSelect = ({ label, options, selected, onChange, max = Infinity }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1 flex flex-wrap gap-2 p-2 bg-gray-200 dark:bg-gray-900/50 rounded-md">
            {options.map(option => (
                <button key={option} onClick={() => {
                    if (selected.includes(option)) { onChange(selected.filter(i => i !== option)); } 
                    else if (selected.length < max) { onChange([...selected, option]); } 
                    else if (max === 1) { onChange([option]); }
                }} className={`px-3 py-1 rounded-full text-sm font-medium transition ${selected.includes(option) ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'}`}>{option}</button>
            ))}
        </div>
    </div>
);

// Main App Component
function App() {
  const [theme, setTheme] = usePersistentState('trip-planner-theme', 'dark');
  const [people, setPeople] = usePersistentState('trip-planner-people', defaultPeople);
  const [cars, setCars] = usePersistentState('trip-planner-cars', defaultCars);
  const [rules, setRules] = usePersistentState('trip-planner-rules', []);
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRuleType, setLastRuleType] = usePersistentState('trip-planner-last-rule', RULE_TYPES.TOGETHER);

  const totalCarSeats = useMemo(() => cars.reduce((sum, car) => sum + car.capacity, 0), [cars]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This will restore the default people and cars, and clear all rules.")) {
        setPeople(defaultPeople);
        setCars(defaultCars);
        setRules([]);
        setAssignments(null);
        setError('');
    }
  };

  const handleGenerateAssignments = useCallback(() => {
    setIsLoading(true);
    setError('');
    setAssignments(null);
    
    if (people.length > totalCarSeats) {
        setError(`Not enough seats! You have ${people.length} people but only ${totalCarSeats} seats available.`);
        setIsLoading(false);
        return;
    }

    setTimeout(() => {
        let currentAssignments = {};
        cars.forEach(car => { currentAssignments[car.id] = { people: [], capacity: car.capacity }; });
        const assignedPeople = new Set();
        const specificCarRules = rules.filter(r => r.type === RULE_TYPES.SPECIFIC_CAR);
        for (const rule of specificCarRules) {
            currentAssignments[rule.carId].people.push(rule.person);
            assignedPeople.add(rule.person);
        }
        const togetherGroups = [];
        const togetherRules = rules.filter(r => r.type === RULE_TYPES.TOGETHER);
        const peopleInGroups = new Set();
        for (const rule of togetherRules) {
            const preAssignedMember = rule.people.find(p => assignedPeople.has(p));
            if (preAssignedMember) {
                 const carId = specificCarRules.find(r => r.person === preAssignedMember).carId;
                 const unassignedInGroup = rule.people.filter(p => !assignedPeople.has(p));
                 unassignedInGroup.forEach(p => { currentAssignments[carId].people.push(p); assignedPeople.add(p); });
            } else {
                 togetherGroups.push(rule.people);
                 rule.people.forEach(p => peopleInGroups.add(p));
            }
        }
        let remainingPeople = people.map(p => p.name).filter(p => !assignedPeople.has(p) && !peopleInGroups.has(p)).map(p => [p]);
        let toAssign = [...togetherGroups, ...remainingPeople];
        
        function solve(assignmentSnapshot, itemsToPlace) {
            if (itemsToPlace.length === 0) return assignmentSnapshot;
            const item = itemsToPlace[0];
            const remainingItems = itemsToPlace.slice(1);
            const shuffledCarIds = [...cars.map(c=>c.id)].sort(() => Math.random() - 0.5);
            for (const carId of shuffledCarIds) {
                const car = assignmentSnapshot[carId];
                if (car.people.length + item.length > car.capacity) continue;
                const separateRules = rules.filter(r => r.type === RULE_TYPES.SEPARATE);
                let violatesSeparation = false;
                for (const personInItem of item) {
                    for (const personInCar of car.people) {
                        if (separateRules.some(rule => (rule.people[0] === personInItem && rule.people[1] === personInCar) || (rule.people[1] === personInItem && rule.people[0] === personInCar))) {
                            violatesSeparation = true; break;
                        }
                    }
                    if (violatesSeparation) break;
                }
                if (violatesSeparation) continue;
                const newSnapshot = JSON.parse(JSON.stringify(assignmentSnapshot));
                newSnapshot[carId].people.push(...item);
                const result = solve(newSnapshot, remainingItems);
                if (result) return result;
            }
            return null;
        }
        
        toAssign.sort(() => Math.random() - 0.5);
        const finalAssignments = solve(currentAssignments, toAssign);

        if (finalAssignments) {
            const allAssigned = Object.values(finalAssignments).flatMap(c => c.people);
            if (new Set(allAssigned).size !== allAssigned.length) {
                setError("Assignment Error: A person was assigned to multiple cars. Please try again.");
            } else {
                setAssignments(finalAssignments);
            }
        } else {
            setError("Could not find a valid assignment. Try removing some rules.");
        }
        setIsLoading(false);
    }, 100);
  }, [people, cars, rules, totalCarSeats]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="relative text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Group Trip Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Organize people into cars with complex rules, made easy.</p>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-0 right-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ListManager title="People" items={people} setItems={setPeople} placeholder="Enter person's name" type="person" />
          <ListManager title="Cars" items={cars} setItems={setCars} placeholder="Enter car's name" type="car" totalSeats={totalCarSeats} />
          <RuleBuilder rules={rules} setRules={setRules} people={people} cars={cars} lastRuleType={lastRuleType} setLastRuleType={setLastRuleType} setGlobalError={setError} />
        </div>

        <div className="flex justify-center items-center gap-4 my-8">
          <Button onClick={handleGenerateAssignments} className="px-8 py-3 text-lg" variant="primary" disabled={isLoading || people.length === 0 || cars.length === 0}>
            {isLoading ? 'Calculating...' : 'Generate Assignments'}
          </Button>
          <Button onClick={handleReset} variant="danger">
            <RefreshIcon /> Reset All Data
          </Button>
        </div>

        {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center mb-6">{error}</div>}
        
        {assignments && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Trip Assignments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.sort((a,b) => a.name.localeCompare(b.name)).map(car => {
                const assignment = assignments[car.id];
                const percentage = car.capacity > 0 ? (assignment.people.length / car.capacity) * 100 : 0;
                return (
                  <div key={car.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{car.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{assignment.people.length} / {car.capacity} seats filled</p>
                    <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2.5 mb-4">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <ul className="space-y-2 flex-grow">
                      {assignment.people.length > 0 ? assignment.people.map(p => <li key={p} className="bg-gray-200 dark:bg-gray-800/50 px-3 py-1 rounded-md text-gray-800 dark:text-white">{p}</li>) : <p className="text-gray-500 italic">Empty</p>}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
