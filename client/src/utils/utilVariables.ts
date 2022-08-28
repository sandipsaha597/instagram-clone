export const DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/api'
    : 'http://43.205.140.166:8080/api'
export const SOCKET_IO_DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081/api'
    : 'http://43.205.140.166:8081/api'
export const border = '1px solid rgb(219, 219, 219)'
