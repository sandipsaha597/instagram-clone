import io from 'socket.io-client'
import { SOCKET_IO_DOMAIN } from './utils/utilVariables'

export const socket = io(SOCKET_IO_DOMAIN, {
  withCredentials: true,
  autoConnect: false,
})
