/** Central route path constants — single source of truth, no magic strings elsewhere. */
export const ROUTES = {
  login: '/login',
  home: '/',
  history: '/history',
  stats: '/stats',
  profiles: '/profiles',
  sessionDetail: (id: string) => `/sessions/${id}`,
  sessionDetailPattern: '/sessions/:id',
  sessionNew: '/sessions/new',
  sessionEdit: (id: string) => `/sessions/${id}/edit`,
  sessionEditPattern: '/sessions/:id/edit',
  sessionStart: '/session/start',
  sessionStartEdit: '/session/start/edit',
  sessionFinish: '/session/finish',
} as const;

/** Routes rendered as a modal overlay via the background-location pattern. */
export const MODAL_ROUTES = [
  ROUTES.sessionNew,
  ROUTES.sessionEditPattern,
  ROUTES.sessionStart,
  ROUTES.sessionStartEdit,
  ROUTES.sessionFinish,
];
