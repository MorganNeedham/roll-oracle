import { useEffect, useState, type FormEvent } from "react";

type Roll = {
  id: number;
  dieType: number;
  result: number;
};

type DiceProfile = {
  id: number;
  name: string;
  dieType: number;
  rolls: Roll[];
};

const STORAGE_KEYS = {
  profiles: "roll-oracle-profiles",
  activeProfileId: "roll-oracle-active-profile-id",
};

const defaultProfiles: DiceProfile[] = [
  {
    id: 1,
    name: "Default d20",
    dieType: 20,
    rolls: [],
  },
];

function loadProfiles() {
  const savedProfiles = localStorage.getItem(STORAGE_KEYS.profiles);

  if (!savedProfiles) {
    return defaultProfiles;
  }

  try {
    const parsedProfiles = JSON.parse(savedProfiles);

    if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
      return parsedProfiles;
    }

    return defaultProfiles;
  } catch {
    return defaultProfiles;
  }
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  const [rollResult, setRollResult] = useState("");

  const [profileName, setProfileName] = useState("");
  const [profileDieType, setProfileDieType] = useState(20);

  const [profiles, setProfiles] = useState<DiceProfile[]>(loadProfiles);

  const [activeProfileId, setActiveProfileId] = useState(() => {
    const savedActiveProfileId = localStorage.getItem(STORAGE_KEYS.activeProfileId);

    if (savedActiveProfileId) {
      return Number(savedActiveProfileId);
    }

  return 1;
});

  useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}, [profiles]);

useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.activeProfileId, String(activeProfileId));
}, [activeProfileId]);

useEffect(() => {
  const activeProfileExists = profiles.some(
    (profile) => profile.id === activeProfileId
  );

  if (!activeProfileExists && profiles.length > 0) {
    setActiveProfileId(profiles[0].id);
  }
}, [profiles, activeProfileId]);
  
  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  const dieType = activeProfile.dieType;

  const selectedDieRolls = activeProfile.rolls;

  const totalRolls = selectedDieRolls.length;

  const rollResults = selectedDieRolls.map((roll) => roll.result);

  const highestRoll = rollResults.length > 0 ? Math.max(...rollResults) : null;

  const lowestRoll = rollResults.length > 0 ? Math.min(...rollResults) : null;

  const averageRoll =
    totalRolls === 0
      ? null
      : selectedDieRolls.reduce((sum, roll) => sum + roll.result, 0) /
        totalRolls;

  const rollCounts = selectedDieRolls.reduce<Record<number, number>>(
    (counts, roll) => {
      counts[roll.result] = (counts[roll.result] ?? 0) + 1;
      return counts;
    },
    {}
  );

  const mostCommonRoll =
    Object.entries(rollCounts).sort(
      ([, countA], [, countB]) => countB - countA
    )[0]?.[0] ?? null;

  function getCurseRating() {
    if (totalRolls === 0 || averageRoll === null) {
      return "Unknown";
    }

    if (totalRolls < 5) {
      return "Too early to tell";
    }

    const expectedAverage = (dieType + 1) / 2;

    if (averageRoll >= expectedAverage + dieType * 0.15) {
      return "Blessed";
    }

    if (averageRoll <= expectedAverage - dieType * 0.15) {
      return "Cursed";
    }

    return "Suspiciously Normal";
  }

  function getCurseScore() {
  if (totalRolls < 5 || averageRoll === null) {
    return 0;
  }

  const expectedAverage = (dieType + 1) / 2;
  const curseDifference = expectedAverage - averageRoll;
  const rawScore = 50 + (curseDifference / expectedAverage) * 50;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

const curseScore = getCurseScore();

const curseMeterText =
  totalRolls < 5 ? "Need at least 5 rolls" : `Curse Meter: ${curseScore}%`;

  function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileName.trim()) {
      alert("Enter a profile name first.");
      return;
    }

    const newProfile: DiceProfile = {
      id: Date.now(),
      name: profileName,
      dieType: profileDieType,
      rolls: [],
    };

    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
    setProfileName("");
    setProfileDieType(20);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericRoll = Number(rollResult);

    if (!rollResult) {
      alert("Enter a roll result first.");
      return;
    }

    if (numericRoll < 1 || numericRoll > dieType) {
      alert(`A d${dieType} roll must be between 1 and ${dieType}.`);
      return;
    }

    const newRoll: Roll = {
      id: Date.now(),
      dieType,
      result: numericRoll,
    };

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activeProfileId
          ? {
              ...profile,
              rolls: [...profile.rolls, newRoll],
            }
          : profile
      )
    );

    setRollResult("");
  }

  function handleRandomRoll() {
    const randomRoll = Math.floor(Math.random() * dieType) + 1;

    const newRoll: Roll = {
      id: Date.now(),
      dieType,
      result: randomRoll,
    };

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activeProfileId
          ? {
              ...profile,
              rolls: [...profile.rolls, newRoll],
            }
          : profile
      )
    );
  }

  function handleClearRolls() {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activeProfileId
          ? {
              ...profile,
              rolls: [],
            }
          : profile
      )
    );
  }

  return (
    <main className="app">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      <section className="hero">
        <p className="eyebrow">Dice Analytics for Tabletop Players</p>

        <img
          className="hero-logo"
          src={`${import.meta.env.BASE_URL}d20-logo.svg`}
          alt="Roll Oracle d20 logo"
        />

        <h1>Roll Oracle</h1>

        <p className="hero-text">
          Track your rolls, reveal your luck patterns, and find out whether your
          dice are blessed, cursed, or simply dramatic.
        </p>
      </section>

      <section className="dashboard">
        <div className="card profile-card">
          <h2>Create Dice Profile</h2>

          <form className="roll-form" onSubmit={handleCreateProfile}>
            <label htmlFor="profile-name">Profile Name</label>
            <input
              id="profile-name"
              type="text"
              placeholder="Example: Red d20"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />

            <label htmlFor="profile-die-type">Die Type</label>
            <select
              id="profile-die-type"
              value={profileDieType}
              onChange={(event) =>
                setProfileDieType(Number(event.target.value))
              }
            >
              <option value="4">d4</option>
              <option value="6">d6</option>
              <option value="8">d8</option>
              <option value="10">d10</option>
              <option value="12">d12</option>
              <option value="20">d20</option>
              <option value="100">d100</option>
            </select>

            <button type="submit">Add Dice Profile</button>
          </form>
        </div>

        <div className="card roll-card">
          <h2>Add a Roll</h2>

          <form className="roll-form" onSubmit={handleSubmit}>
            <label htmlFor="active-profile">Dice Profile</label>
            <select
              id="active-profile"
              value={activeProfileId}
              onChange={(event) =>
                setActiveProfileId(Number(event.target.value))
              }
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} — d{profile.dieType}
                </option>
              ))}
            </select>

            <label htmlFor="roll-result">Roll Result</label>
            <input
              id="roll-result"
              type="number"
              min="1"
              max={dieType}
              placeholder="Enter your roll"
              value={rollResult}
              onChange={(event) => setRollResult(event.target.value)}
            />

            <button type="submit">Record Roll</button>

            <button type="button" onClick={handleRandomRoll}>
              Roll a Random d{dieType}
            </button>

            <button
              type="button"
              onClick={handleClearRolls}
              disabled={selectedDieRolls.length === 0}
            >
              Clear This Profile&apos;s Rolls
            </button>
          </form>
        </div>

        <div className="card stats-card">
          <h2>Roll Stats</h2>

          <div className="stats-grid">
            <div>
              <p className="stat-label">Current Profile</p>
              <p className="stat-value">{activeProfile.name}</p>
            </div>

            <div>
              <p className="stat-label">Tracked d{dieType} Rolls</p>
              <p className="stat-value">{totalRolls}</p>
            </div>

            <div>
              <p className="stat-label">Average Roll</p>
              <p className="stat-value">
                {averageRoll === null ? "—" : averageRoll.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="stat-label">Highest Roll</p>
              <p className="stat-value">
                {highestRoll === null ? "—" : highestRoll}
              </p>
            </div>

            <div>
              <p className="stat-label">Lowest Roll</p>
              <p className="stat-value">
                {lowestRoll === null ? "—" : lowestRoll}
              </p>
            </div>

            <div>
              <p className="stat-label">Most Common</p>
              <p className="stat-value">
                {mostCommonRoll === null ? "—" : mostCommonRoll}
              </p>
            </div>

            <div>
              <p className="stat-label">Curse Rating</p>
              <p className="stat-value">{getCurseRating()}</p>
            </div>

            <div className="curse-meter-section">
             <div className="curse-meter-header">
              <strong>{curseMeterText}</strong>
            </div>

              <div className="curse-meter">
                <div
                  className="curse-meter-fill"
                  style={{
                    width: totalRolls < 5 ? "0%" : `${curseScore}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card recent-rolls-card">
          <h2>Recent Rolls</h2>

          {selectedDieRolls.length === 0 ? (
            <p className="empty-message">
              No rolls recorded for this profile yet.
            </p>
          ) : (
            <ul className="roll-list">
              {selectedDieRolls
                .slice(-8)
                .reverse()
                .map((roll) => (
                  <li key={roll.id}>
                    {activeProfile.name}: d{roll.dieType}:{" "}
                    <strong>{roll.result}</strong>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
