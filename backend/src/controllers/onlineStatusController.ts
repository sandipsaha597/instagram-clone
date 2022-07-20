import { Socket } from 'socket.io'

export const handleUserConnect = async (socket: Socket, io: any) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  socket.join(userId)
  // online status of users
  const userSockets = await io.in(userId).allSockets()
  if (userSockets.size === 1) {
    // @ts-ignore
    console.log('connect', socket.jwtPayload.username + ' came online')
    // @ts-ignore
    socket.to('online-status_' + userId).emit('online-status', {
      online: true,
      // @ts-ignore
      _id: socket.jwtPayload._id,
    })
  }
}

export const handleUserDisconnect = async (socket: Socket, io: any) => {
  // @ts-ignore
  const userId = socket.jwtPayload._id
  const userSockets = await io.in(userId).allSockets()
  if (userSockets.size === 0) {
    //@ts-ignore
    console.log('disconnect', socket.jwtPayload.username + ' went offline')
    socket
      // @ts-ignore
      .to('online-status_' + userId)
      .emit('online-status', {
        online: false,
        // @ts-ignore
        _id: socket.jwtPayload._id,
      })
  }
}
