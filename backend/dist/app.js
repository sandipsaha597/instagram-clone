"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require('dotenv').config();
require('./config/database').connect();
var express_1 = __importDefault(require("express"));
var cloudinary_1 = __importDefault(require("cloudinary"));
var cloudinaryV2 = cloudinary_1.default.v2;
var cors_1 = __importDefault(require("cors"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var auth_1 = require("./middleware/auth");
var utilVariables_1 = require("./utils/utilVariables");
var socket_io_1 = require("socket.io");
var chatSystemController_1 = require("./controllers/chatSystemController");
var onlineStatusController_1 = require("./controllers/onlineStatusController");
var post_1 = __importDefault(require("./routes/post"));
var chat_1 = __importDefault(require("./routes/chat"));
var followUnfollow_1 = __importDefault(require("./routes/followUnfollow"));
var profilePage_1 = __importDefault(require("./routes/profilePage"));
var user_1 = __importDefault(require("./routes/user"));
var inbox_1 = __importDefault(require("./models/inbox"));
var chat_2 = __importDefault(require("./models/chat"));
var searchUser_1 = __importDefault(require("./routes/searchUser"));
var app = (0, express_1.default)();
app.use((0, cors_1.default)(utilVariables_1.corsOptions));
app.use(express_1.default.json({ limit: '20mb' }));
app.use((0, cookie_parser_1.default)());
cloudinaryV2.config({
    cloud_name: 'dbevmtl8a',
    api_key: '361927556573343',
    api_secret: 'TvCwLE-aYy9lWo1VQRbEgX86Cmk',
});
// TODO: express server and socket.io server should be served from the same port
//socket.io
exports.io = new socket_io_1.Server(4001, { cors: utilVariables_1.corsOptions });
exports.io.use(auth_1.authInSocketIO);
exports.io.on('connection', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, inboxFilter, inboxes, inboxIds, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = socket.jwtPayload._id;
                // online status of users
                (0, onlineStatusController_1.handleUserConnect)(socket, exports.io);
                socket.on('disconnect', function () { return (0, onlineStatusController_1.handleUserDisconnect)(socket, exports.io); });
                // online status of users --end
                socket.on('get-inboxes', function (data, callback) { return (0, chatSystemController_1.getInboxes)(socket, exports.io, callback); });
                socket.on('message', function (data, callback) { return (0, chatSystemController_1.message)(socket, exports.io, data, callback); });
                socket.on('message-delivered', function (data) { return (0, chatSystemController_1.messageDelivered)(socket, exports.io, data); });
                socket.on('message-seen', function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, (0, chatSystemController_1.messageSeen)(socket, exports.io, data)];
                }); }); });
                socket.on('message-seen-all', function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, (0, chatSystemController_1.messageSeenAll)(socket, exports.io, data)];
                }); }); });
                socket.on('subscribe-online-status', function (data, callback) {
                    try {
                        socket.join('online-status_' + data.userId);
                        var rooms = exports.io.of('/').adapter.rooms;
                        callback({ online: rooms.has(data.userId) });
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                inboxFilter = {
                    participants: { $elemMatch: { _id: userId }, $size: 2 },
                    'lastActivity.messageStatus': 'sent',
                    'lastActivity.sentBy': { $ne: userId },
                };
                return [4 /*yield*/, inbox_1.default.find(inboxFilter, { _id: 1 })];
            case 2:
                inboxes = _a.sent();
                if (inboxes.length === 0)
                    return [2 /*return*/];
                // messages are delivered to this user so update inbox lastActivities and chats
                return [4 /*yield*/, inbox_1.default.updateMany(inboxFilter, {
                        $set: { 'lastActivity.messageStatus': 'delivered' },
                    })];
            case 3:
                // messages are delivered to this user so update inbox lastActivities and chats
                _a.sent();
                inboxIds = inboxes.map(function (v) {
                    return {
                        sentTo: v._id,
                        messageStatus: 'sent',
                        sentBy: { $ne: userId },
                    };
                });
                return [4 /*yield*/, chat_2.default.updateMany({ $or: inboxIds }, {
                        $set: { messageStatus: 'delivered' },
                    })];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                console.error(err_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// socket.io - end
app.use('/api', user_1.default);
app.use('/api', post_1.default);
app.use('/api', chat_1.default);
app.use('/api', followUnfollow_1.default);
app.use('/api', profilePage_1.default);
app.use('/api', searchUser_1.default);
// app.put(
//   '/api/normalize/set-profile-picture-default-and-publicId',
//   async (req, res) => {
//     console.log('request')
//     const output = await User.updateMany([
//       {
//         $addFields: {
//           'profilePicture.cloudinaryImagePublicId':
//             'instagram-clone-default-dp',
//         } as any,
//       },
//     ])
//     // const output = await User.updateMany({}, {
//     //   $unset: 'profilePicture.publicId',
//     // } as any)
//     // const output = await User.updateMany([
//     //   {
//     //     $unset: ['profilePicture.publicId'],
//     //   },
//     // ])
//     console.log(output)
//     res.send('done')
//   }
// )
// app.delete('/deleteImage', async (req: Request, res: Response) => {
//   const destroyAll = () => {
//     // if (destroyImagesUponFail.count === images.length) {
//     // @ts-ignore
//     cloudinary.uploader
//       .destroy('images/wjkyahqruhabtctugxsc')
//       .then((v: any) => {
//         console.log(v)
//       })
//       .catch((err: any) => console.error(err))
//   }
//   // }
//   destroyAll()
// })
exports.default = app;
