export const serverError = (path = '/') => ({
  statusCode: 500,
  body: JSON.stringify({
    type: 'urn:problem:server-error',
    title: 'Server Error',
    detail: 'An unexpected error has occurred, contact the administrator.',
    instance: path,
    status: 500,
  }),
  headers: {
    'Content-Type': 'application/problem+json',
  },
})

export const ok = (body) => ({
  statusCode: 200,
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
  },
})

export const okHTML = (body) => ({
  statusCode: 200,
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'text/html',
  },
})

export const noContent = () => ({
  statusCode: 204,
})

export const badRequest =
  (detail) =>
  (path = '/') => ({
    statusCode: 400,
    body: JSON.stringify({
      type: 'urn:problem:bad-request',
      title: 'Bad Request',
      detail,
      instance: path,
      status: 400,
    }),
    headers: {
      'Content-Type': 'application/problem+json',
    },
  })

export const unauthorized =
  (detail) =>
  (path = '/') => ({
    statusCode: 401,
    body: JSON.stringify({
      type: 'urn:problem:unauthorized',
      title: 'Unauthorized',
      detail,
      instance: path,
      status: 401,
    }),
    headers: {
      'Content-Type': 'application/problem+json',
    },
  })

export const notImplemented = (path = '/') => ({
  statusCode: 501,
  body: JSON.stringify({
    type: 'urn:problem:not-implemented',
    title: 'Not Implemented',
    detail: 'Not Implemented',
    instance: path,
    status: 501,
  }),
  headers: {
    'Content-Type': 'application/problem+json',
  },
})
