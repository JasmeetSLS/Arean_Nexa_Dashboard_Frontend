import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight, Save, Check, ShieldCheck, Search, X, UserCog,
  Radio, Trophy, BarChart3, Route, UserCircle2,
  Users, MapPin, Globe2,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../service/auth.jsx';
import {
  getPermissionAdmins,
  getPermissionOptions,
  savePermissions,
} from '../service/api';

// =====================================================================
// STATIC SECTIONS  (was setup_field_master — now hardcoded)
// Each section: key, icon, title, subtitle, fields[]
// =====================================================================
const STATIC_SECTIONS = [
  {
    key: 'filters',
    icon: Search,
    title: 'Required Filters',
    subtitle: 'Filters visible on the dashboard',
    fields: [
      { field_key: 'region' },
      { field_key: 'zone'   },
      { field_key: 'role'   },
      { field_key: 'project'},
    ],
  },
  {
    key: 'todayLive',
    icon: Radio,
    title: "Today's Live Data",
    subtitle: 'Data boxes shown in the today section',
    fields: [
      { field_key: 'scheduled'      },
      { field_key: 'attempted'      },
      { field_key: 'absentees'      },
      { field_key: 'delayed'        },
      { field_key: 'passRate'       },
      { field_key: 'avgTime'        },
      { field_key: 'activeTrainers' },
    ],
  },
  {
    key: 'contest',
    icon: Trophy,
    title: 'Contest Totals',
    subtitle: 'Data boxes shown in contest totals',
    fields: [
      { field_key: 'totalScheduled' },
      { field_key: 'totalAttempted' },
      { field_key: 'totalAbsentees' },
      { field_key: 'totalDelayed'   },
      { field_key: 'totalResets'    },
      { field_key: 'overallPass'    },
      { field_key: 'overallAvg'     },
    ],
  },
  {
    key: 'metrics',
    icon: BarChart3,
    title: 'Metric Sections',
    subtitle: 'Metrics displayed on the dashboard',
    fields: [
      { field_key: 'trainerAssigned'   },
      { field_key: 'trainerPassRate'   },
      { field_key: 'trainerAvgTime'    },
      { field_key: 'participantStatus' },
    ],
  },
  {
    key: 'participantJourney',
    icon: Route,
    title: 'Participant Journey',
    subtitle: 'Fields shown in the participant popup',
    fields: [
      { field_key: 'rounds'     },
      { field_key: 'percentage' },
      { field_key: 'totalTime'  },
      { field_key: 'status'     },
      { field_key: 'milestones' },
    ],
  },
  {
    key: 'trainerJourney',
    icon: UserCircle2,
    title: 'Trainer Journey',
    subtitle: 'Fields shown in the trainer popup',
    fields: [
      { field_key: 'completed'       },
      { field_key: 'passRate'        },
      { field_key: 'avgTime'         },
      { field_key: 'roundMilestones' },
      { field_key: 'recentList'      },
    ],
  },
];

// =====================================================================
// STATIC PERMISSION GROUPS  (Role / Zone / Project)
// =====================================================================
const STATIC_PERMISSION_GROUPS = [
  {
    kind: 'single',
    groupKey: 'role',
    icon: Users,
    title: 'Role',
    subtitle: 'Job roles this user can access',
  },
  {
    kind: 'single',
    groupKey: 'zone',
    icon: MapPin,
    title: 'Zone',
    subtitle: 'Zones this user can access',
  },
  {
    kind: 'single',
    groupKey: 'project',
    icon: Trophy,
    title: 'Project',
    subtitle: 'Projects this user can access',
  },
];

const prettify = (k) =>
  k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

// =====================================================================
// PAGE
// =====================================================================
export default function RolesPermissions() {
  const { user } = useAuth();

  const [admins, setAdmins]   = useState([]);
  const [search, setSearch]   = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [roles, setRoles]       = useState([]);
  const [zones, setZones]       = useState([]);
  const [regions, setRegions]   = useState([]);
  const [projects, setProjects] = useState([]);

  const [selected, setSelected] = useState({
    role: {}, zone: {}, region: {}, project: {},
  });

  const [savedMsg, setSavedMsg] = useState('');
  const searchWrapRef = useRef(null);

  // ---- load admin list once ----
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getPermissionAdmins();
        if (data?.success) setAdmins(data.admins || []);
      } catch (err) {
        console.error('[perm admins]', err);
      }
    })();
  }, []);

  // ---- load options when admin changes ----
  useEffect(() => {
    if (!selectedUserId) return;
    (async () => {
      try {
        const { data } = await getPermissionOptions(selectedUserId);
        if (!data?.success) return;

        setRoles(data.roles       || []);
        setZones(data.zones       || []);
        setRegions(data.regions   || []);
        setProjects(data.projects || []);

        // build defaults from STATIC_SECTIONS
        const base = {
          role:    Object.fromEntries((data.roles    || []).map((r) => [r, false])),
          zone:    Object.fromEntries((data.zones    || []).map((z) => [z, false])),
          region:  Object.fromEntries((data.regions  || []).map((r) => [r, false])),
          project: Object.fromEntries((data.projects || []).map((p) => [p, false])),
        };
        STATIC_SECTIONS.forEach((s) => {
          base[s.key] = Object.fromEntries(s.fields.map((f) => [f.field_key, false]));
        });

        // merge existing
        const ex = data.existing;
        if (ex) {
          (ex.allowed_roles    || []).forEach((r) => { if (r in base.role)    base.role[r]    = true; });
          (ex.allowed_zones    || []).forEach((z) => { if (z in base.zone)    base.zone[z]    = true; });
          (ex.allowed_regions  || []).forEach((r) => { if (r in base.region)  base.region[r]  = true; });
          (ex.allowed_projects || []).forEach((p) => { if (p in base.project) base.project[p] = true; });

          const perms = ex.permissions || {};
          Object.entries(perms).forEach(([grp, obj]) => {
            if (!base[grp]) base[grp] = {};
            Object.entries(obj).forEach(([k, v]) => {
              if (k in base[grp]) base[grp][k] = !!v;
            });
          });
        }

        setSelected(base);
      } catch (err) {
        console.error('[perm options]', err);
      }
    })();
  }, [selectedUserId]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => a.username.toLowerCase().includes(q));
  }, [admins, search]);

  const selectedUser = admins.find((a) => a.id === selectedUserId);
  const current      = selectedUserId ? selected : null;

  const toggleItem = (groupKey, itemKey) => {
    setSelected((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [itemKey]: !prev[groupKey]?.[itemKey] },
    }));
  };

  const toggleAllKeys = (groupKey, keys) => {
    setSelected((prev) => {
      const g = prev[groupKey] || {};
      const allOn = keys.every((k) => g[k]);
      const updated = { ...g };
      keys.forEach((k) => { updated[k] = !allOn; });
      return { ...prev, [groupKey]: updated };
    });
  };

  const handleSelectUser = (u) => {
    setSelectedUserId(u.id);
    setSearch(u.username);
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedUserId(null);
    setSearch('');
    setShowResults(false);
  };

  const handleSave = async () => {
    if (!selectedUserId || !current) return;

    // build permissions payload from STATIC_SECTIONS
    const permissions = {};
    STATIC_SECTIONS.forEach((s) => {
      permissions[s.key] = {};
      s.fields.forEach((f) => {
        permissions[s.key][f.field_key] = !!current[s.key]?.[f.field_key];
      });
    });

    const allowedRoles    = Object.keys(current.role   ).filter((k) => current.role[k]);
    const allowedZones    = Object.keys(current.zone   ).filter((k) => current.zone[k]);
    const allowedRegions  = Object.keys(current.region ).filter((k) => current.region[k]);
    const allowedProjects = Object.keys(current.project).filter((k) => current.project[k]);

    try {
      const { data } = await savePermissions({
        userId: selectedUserId,
        allowedRoles, allowedZones, allowedRegions,
        allowedProjects,
        permissions,
      });
      setSavedMsg(data?.success ? 'Saved' : (data?.error || 'Save failed'));
    } catch (err) {
      console.error('[perm save]', err);
      setSavedMsg(err?.response?.data?.error || 'Save failed');
    } finally {
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const ROWS = current
    ? [
        ...STATIC_PERMISSION_GROUPS.map((g) => {
          const optSource =
            g.groupKey === 'role'    ? roles    :
            g.groupKey === 'zone'    ? zones    :
            g.groupKey === 'project' ? projects : [];

          return {
            ...g,
            options: optSource.map((v) => ({ key: v, label: v })),
          };
        }),
        ...STATIC_SECTIONS.map((s) => ({
          kind: 'group',
          icon: s.icon,
          title: s.title,
          subtitle: s.subtitle,
          groupKey: s.key,
          options: s.fields.map((f) => ({
            key: f.field_key,
            label: prettify(f.field_key),
          })),
        })),
      ]
    : [];

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">
      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-gray-200 z-30">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Roles & Permissions
          </h1>
          <p className="text-[11px] font-medium text-slate-500">
            Search a user and toggle their permissions
          </p>
        </div>
        <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 bg-white border border-gray-200 rounded-full">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-black">
            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] font-black text-slate-900">{user?.name || 'Admin'}</p>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="relative w-full max-w-md" ref={searchWrapRef}>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">
              Search User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowResults(true);
                  if (selectedUserId) setSelectedUserId(null);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Type name..."
                className="w-full pl-10 pr-9 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              {search && (
                <button
                  onClick={clearSelection}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showResults && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto z-40">
                {results.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">
                    No users match your search
                  </div>
                ) : (
                  results.map((u) => {
                    const active = u.id === selectedUserId;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition border-l-2 ${
                          active ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-xs font-bold truncate ${active ? 'text-blue-800' : 'text-slate-800'}`}>
                          {u.username}
                        </span>
                        {active && <Check className="h-4 w-4 text-blue-600 shrink-0" strokeWidth={3} />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {!selectedUser ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <UserCog className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Select a user to configure permissions
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-xs">
              Use the search box above to find a user, then toggle their permissions below.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[260px]">Section</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Options</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">Selected</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[120px]">Toggle All</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, idx) => {
                  const Icon = row.icon;
                  const value = current[row.groupKey] || {};
                  const selectedCount = row.options.filter((o) => value[o.key]).length;
                  const totalCount    = row.options.length;
                  const allOn         = selectedCount === totalCount && totalCount > 0;

                  return (
                    <tr
                      key={row.groupKey}
                      className={`align-top ${
                        idx !== ROWS.length - 1 ? 'border-b border-slate-100' : ''
                      } hover:bg-blue-50/30 transition`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Icon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-black text-slate-900 leading-tight">{row.title}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{row.subtitle}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {totalCount === 0 ? (
                          <p className="text-[11px] italic text-slate-400">No options available</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {row.options.map((o) => (
                              <Pill
                                key={o.key}
                                label={o.label}
                                active={!!value[o.key]}
                                onClick={() => toggleItem(row.groupKey, o.key)}
                              />
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-[11px] font-black px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                          {selectedCount} / {totalCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAllKeys(row.groupKey, row.options.map((o) => o.key))}
                          disabled={totalCount === 0}
                          className={`text-[11px] font-black px-3 py-1.5 rounded-md border transition ${
                            totalCount === 0
                              ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                              : allOn
                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {allOn ? 'Clear All' : 'Select All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="shrink-0 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-end z-20">
        <div className="flex items-center gap-3">
          {savedMsg && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> {savedMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={!selectedUser}
            className={`flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition ${
              selectedUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            Save Permissions
          </button>
        </div>
      </footer>
    </div>
  );
}

// =====================================================================
function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50/60'
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <XCircle className="h-3 w-3" strokeWidth={2.5} />
      )}
      {label}
    </button>
  );
}