export const DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/api'
    : 'http://ec2-43-205-140-166.ap-south-1.compute.amazonaws.com:8080/api'
export const SOCKET_IO_DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081'
    : 'http://ec2-43-205-140-166.ap-south-1.compute.amazonaws.com:8081'
export const border = '1px solid rgb(219, 219, 219)'
