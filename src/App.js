import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Helper Functions & Constants ---

// Simple UUID generator for unique keys
const uuid = () => `id_${Math.random().toString(36).substr(2, 9)}`;

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

// Icon components for better UI
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// Generic input field component - updated to merge classNames
const Input = ({ className = '', ...props }) => (
  <input className={`w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${className}`} {...props} />
);

// Generic button component
const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseClasses = "px-4 py-2 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
  };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
};

// Component for managing a list of items (people or cars) - updated with counter
const ListManager = ({ title, items, setItems, placeholder, type }) => {
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

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4 flex justify-between items-center">
        <span>{title}</span>
        <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">{items.length}</span>
      </h2>
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <Input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={placeholder}
        />
        {type === 'car' && (
          <Input
            type="number"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            min="1"
            className="w-24"
            placeholder="Seats"
          />
        )}
        <Button type="submit" variant="primary"><PlusIcon /></Button>
      </form>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
            <span className="text-white">{item.name}{type === 'car' && ` (${item.capacity} seats)`}</span>
            <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-500"><TrashIcon /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component for building and displaying rules - updated with counter
const RuleBuilder = ({ rules, setRules, people, cars, lastRuleType, setLastRuleType }) => {
  const [ruleType, setRuleType] = useState(lastRuleType);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(cars.length > 0 ? cars[0].id : '');

  useEffect(() => {
    setRuleType(lastRuleType); // Sync with parent state when a new rule is added
    setSelectedPeople([]);
    if (cars.length > 0 && !selectedCarId) {
        setSelectedCarId(cars[0].id)
    }
  }, [lastRuleType, cars]);

  const handleAddRule = () => {
    let newRule = { id: uuid(), type: ruleType };
    let isValid = false;

    switch (ruleType) {
      case RULE_TYPES.TOGETHER:
        if (selectedPeople.length > 1) {
          newRule.people = selectedPeople;
          isValid = true;
        }
        break;
      case RULE_TYPES.SEPARATE:
        if (selectedPeople.length === 2) {
          newRule.people = selectedPeople;
          isValid = true;
        }
        break;
      case RULE_TYPES.SPECIFIC_CAR:
        if (selectedPeople.length === 1 && selectedCarId) {
          newRule.person = selectedPeople[0];
          newRule.carId = selectedCarId;
          isValid = true;
        }
        break;
      default:
        break;
    }

    if (isValid) {
      setRules([...rules, newRule]);
      setLastRuleType(ruleType); // This triggers the useEffect to reset the form
    } else {
      alert("Please ensure you've selected the correct number of people/cars for this rule.");
    }
  };
  
  const handleDeleteRule = (id) => {
      setRules(rules.filter(r => r.id !== id));
  };
  
  const getRuleText = (rule) => {
    const peopleNames = (rule.people || (rule.person ? [rule.person] : [])).join(', ');
    switch(rule.type) {
        case RULE_TYPES.TOGETHER:
            return `${peopleNames} must travel together.`;
        case RULE_TYPES.SEPARATE:
            return `${peopleNames} must travel separately.`;
        case RULE_TYPES.SPECIFIC_CAR:
            const carName = cars.find(c => c.id === rule.carId)?.name || 'Unknown Car';
            return `${rule.person} must be in ${carName}.`;
        default:
            return 'Unknown rule';
    }
  };

  const renderRuleInput = () => {
    const personOptions = people.map(p => p.name);
    const carOptions = cars;

    switch (ruleType) {
      case RULE_TYPES.TOGETHER:
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Select 2 or more people:</label>
            <MultiSelect options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} />
          </div>
        );
      case RULE_TYPES.SEPARATE:
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Select exactly 2 people:</label>
             <MultiSelect options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} max={2}/>
          </div>
        );
      case RULE_TYPES.SPECIFIC_CAR:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Select 1 person:</label>
                <MultiSelect options={personOptions} selected={selectedPeople} onChange={setSelectedPeople} max={1}/>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Select car:</label>
                <select 
                    value={selectedCarId} 
                    onChange={e => setSelectedCarId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={carOptions.length === 0}>
                    {carOptions.length > 0 ? carOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Add a car first</option>}
                </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 md:col-span-2">
      <h2 className="text-xl font-bold text-white mb-4 flex justify-between items-center">
        <span>Rules</span>
        <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">{rules.length}</span>
      </h2>
      <div className="bg-gray-900/50 p-4 rounded-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="rule-type" className="block text-sm font-medium text-gray-300 mb-1">Rule Type</label>
            <select id="rule-type" value={ruleType} onChange={e => setRuleType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(RULE_DESCRIPTIONS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        {renderRuleInput()}
        <Button onClick={handleAddRule} className="mt-4 w-full md:w-auto" disabled={people.length === 0}>
          <PlusIcon /> Add Rule
        </Button>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Current Rules:</h3>
      <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {rules.length > 0 ? rules.map(rule => (
          <li key={rule.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
            <span className="text-white text-sm">{getRuleText(rule)}</span>
            <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-500"><TrashIcon /></button>
          </li>
        )) : <p className="text-gray-400">No rules defined yet.</p>}
      </ul>
    </div>
  );
};

// Custom multi-select component
const MultiSelect = ({ options, selected, onChange, max = Infinity }) => {
    const toggleSelection = (option) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            if (selected.length < max) {
                onChange([...selected, option]);
            } else if (max === 1) {
                onChange([option]);
            }
        }
    };

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 rounded-md">
            {options.map(option => (
                <button 
                    key={option} 
                    onClick={() => toggleSelection(option)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${selected.includes(option) ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};


// Main App Component
function App() {
  const [people, setPeople] = useState([
      {id: uuid(), name: 'Alice'}, {id: uuid(), name: 'Bob'}, {id: uuid(), name: 'Charlie'},
      {id: uuid(), name: 'Dana'}, {id: uuid(), name: 'Eve'}, {id: uuid(), name: 'Frank'},
      {id: uuid(), name: 'Grace'}, {id: uuid(), name: 'Heidi'}
  ]);
  const [cars, setCars] = useState([
      {id: uuid(), name: 'Sedan', capacity: 4},
      {id: uuid(), name: 'Coupe', capacity: 2},
      {id: uuid(), name: 'SUV', capacity: 5},
  ]);
  const [rules, setRules] = useState([]);
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRuleType, setLastRuleType] = useState(RULE_TYPES.TOGETHER);

  const peopleNames = useMemo(() => people.map(p => p.name), [people]);
  const carIds = useMemo(() => cars.map(c => c.id), [cars]);

  // Cleanup rules if people/cars are deleted
  useEffect(() => {
    const updatedRules = rules.filter(rule => {
        if (rule.type === RULE_TYPES.SPECIFIC_CAR) {
            return peopleNames.includes(rule.person) && carIds.includes(rule.carId);
        }
        if (rule.people) {
            return rule.people.every(p => peopleNames.includes(p));
        }
        return true;
    });
    if(updatedRules.length !== rules.length) {
        setRules(updatedRules);
    }
  }, [peopleNames, carIds, rules]);


  const handleGenerateAssignments = useCallback(() => {
    setIsLoading(true);
    setError('');
    setAssignments(null);

    // Use a timeout to allow the UI to update to the loading state
    setTimeout(() => {
        // --- Core Distribution Logic ---

        // 1. Initialize assignments and check for initial rule violations
        let currentAssignments = {};
        cars.forEach(car => {
            currentAssignments[car.id] = { people: [], capacity: car.capacity };
        });

        const assignedPeople = new Set();
        const specificCarRules = rules.filter(r => r.type === RULE_TYPES.SPECIFIC_CAR);

        for (const rule of specificCarRules) {
            if (currentAssignments[rule.carId].people.length >= currentAssignments[rule.carId].capacity) {
                setError(`Rule violation: Cannot place ${rule.person} in ${cars.find(c=>c.id === rule.carId).name}, it's already full.`);
                setIsLoading(false);
                return;
            }
            currentAssignments[rule.carId].people.push(rule.person);
            assignedPeople.add(rule.person);
        }
        
        // 2. Group people who must travel together
        const togetherGroups = [];
        const togetherRules = rules.filter(r => r.type === RULE_TYPES.TOGETHER);
        const peopleInGroups = new Set();

        for (const rule of togetherRules) {
            // Check if anyone in the group is already assigned to a specific car
            const preAssignedMember = rule.people.find(p => assignedPeople.has(p));
            if (preAssignedMember) {
                 const carId = specificCarRules.find(r => r.person === preAssignedMember).carId;
                 const groupSize = rule.people.length;
                 const unassignedInGroup = rule.people.filter(p => !assignedPeople.has(p));
                 
                 if(currentAssignments[carId].people.length + unassignedInGroup.length > currentAssignments[carId].capacity) {
                     setError(`Rule violation: Group [${rule.people.join(', ')}] cannot fit in their assigned car.`);
                     setIsLoading(false);
                     return;
                 }
                 unassignedInGroup.forEach(p => {
                     currentAssignments[carId].people.push(p);
                     assignedPeople.add(p);
                 });
            } else {
                 togetherGroups.push(rule.people);
                 rule.people.forEach(p => peopleInGroups.add(p));
            }
        }
        
        // 3. Get remaining individual people to assign
        let remainingPeople = people
            .map(p => p.name)
            .filter(p => !assignedPeople.has(p) && !peopleInGroups.has(p))
            .map(p => [p]); // Treat individuals as a group of 1

        let toAssign = [...togetherGroups, ...remainingPeople];
        
        // --- Backtracking Solver ---
        function solve(assignmentSnapshot, itemsToPlace) {
            if (itemsToPlace.length === 0) {
                return assignmentSnapshot; // Success
            }

            const item = itemsToPlace[0];
            const remainingItems = itemsToPlace.slice(1);
            
            // Randomize car order to get different results on each run
            const shuffledCarIds = [...carIds].sort(() => Math.random() - 0.5);

            for (const carId of shuffledCarIds) {
                const car = assignmentSnapshot[carId];

                // Check 1: Capacity
                if (car.people.length + item.length > car.capacity) {
                    continue;
                }

                // Check 2: "Cannot travel together" rule
                const separateRules = rules.filter(r => r.type === RULE_TYPES.SEPARATE);
                let violatesSeparation = false;
                for (const personInItem of item) {
                    for (const personInCar of car.people) {
                        if (separateRules.some(rule => 
                            (rule.people[0] === personInItem && rule.people[1] === personInCar) ||
                            (rule.people[1] === personInItem && rule.people[0] === personInCar)
                        )) {
                            violatesSeparation = true;
                            break;
                        }
                    }
                    if (violatesSeparation) break;
                }
                if (violatesSeparation) {
                    continue;
                }

                // If valid, place the item and recurse
                const newSnapshot = JSON.parse(JSON.stringify(assignmentSnapshot));
                newSnapshot[carId].people.push(...item);
                
                const result = solve(newSnapshot, remainingItems);
                if (result) {
                    return result; // Solution found
                }
            }
            
            return null; // No solution found down this path
        }
        
        // Shuffle items to assign for randomness
        toAssign.sort(() => Math.random() - 0.5);
        
        const finalAssignments = solve(currentAssignments, toAssign);

        if (finalAssignments) {
            // Balancing post-check (simple version)
            // A more complex version would integrate balancing into the solver heuristic
            const occupancies = Object.values(finalAssignments).map(c => c.people.length);
            const maxOccupancy = Math.max(...occupancies);
            const minOccupancy = Math.min(...occupancies.filter(o => o > 0)); // Don't count empty cars
            
            if (maxOccupancy > minOccupancy + 2 && people.length > cars.length) {
                 // This is a simple flag, a better system might re-run the solver
                 console.warn("Distribution may not be perfectly balanced.");
            }
            
            // Don't allow single person in a car if avoidable
            const singleOccupantCars = Object.values(finalAssignments).filter(c => c.people.length === 1);
            const carsWithSpace = Object.values(finalAssignments).filter(c => c.people.length < c.capacity);
            if(singleOccupantCars.length > 0 && carsWithSpace.length > singleOccupantCars.length) {
                console.warn("Found a solution with a lone traveler, which might be avoidable. Trying again could yield a better result.");
            }

            setAssignments(finalAssignments);
        } else {
            setError("Could not find a valid assignment with the given rules and people. Try removing some constraints.");
        }
        setIsLoading(false);
    }, 100); // End of setTimeout
  }, [people, cars, rules]);

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Group Trip Planner
          </h1>
          <p className="text-gray-400 mt-2">Organize people into cars with complex rules, made easy.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ListManager title="People" items={people} setItems={setPeople} placeholder="Enter person's name" type="person" />
          <ListManager title="Cars" items={cars} setItems={setCars} placeholder="Enter car's name" type="car" />
          <RuleBuilder 
            rules={rules} 
            setRules={setRules} 
            people={people} 
            cars={cars}
            lastRuleType={lastRuleType}
            setLastRuleType={setLastRuleType}
          />
        </div>

        <div className="text-center my-8">
          <Button onClick={handleGenerateAssignments} className="px-8 py-3 text-lg" disabled={isLoading || people.length === 0 || cars.length === 0}>
            {isLoading ? 'Calculating...' : 'Generate Assignments'}
          </Button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mb-6">{error}</div>}
        
        {assignments && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Trip Assignments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.sort((a,b) => a.name.localeCompare(b.name)).map(car => {
                const assignment = assignments[car.id];
                const occupancy = assignment.people.length;
                const capacity = assignment.capacity;
                const percentage = capacity > 0 ? (occupancy / capacity) * 100 : 0;
                
                return (
                  <div key={car.id} className="bg-gray-700 p-4 rounded-lg flex flex-col">
                    <h3 className="text-xl font-semibold text-blue-400">{car.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {occupancy} / {capacity} seats filled
                    </p>
                    <div className="w-full bg-gray-600 rounded-full h-2.5 mb-4">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <ul className="space-y-2 flex-grow">
                      {assignment.people.length > 0 ? assignment.people.map(p => (
                        <li key={p} className="bg-gray-800/50 px-3 py-1 rounded-md text-white">{p}</li>
                      )) : <p className="text-gray-500 italic">Empty</p>}
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
