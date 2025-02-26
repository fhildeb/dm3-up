// Importing the necessary modules and functions
import cors from 'cors';
import { NotificationChannelType } from 'dm3-lib-delivery';
import { normalizeEnsName } from 'dm3-lib-profile';
import express from 'express';
import { auth } from './utils';

// Exporting a function that returns an Express router
export default () => {
    const router = express.Router();

    // Applying CORS middleware to allow cross-origin requests
    router.use(cors());

    // Adding a route parameter middleware named 'ensName'
    router.param('ensName', auth);

    // Defining a route to handle POST requests for adding an email notification channel
    router.post('/email/:ensName', async (req, res, next) => {
        try {
            const account = normalizeEnsName(req.params.ensName);

            // Extracting recipientAddress from the request body
            const { recipientAddress } = req.body;

            // Adding a user's notification channel to the database
            await req.app.locals.db.addUsersNotificationChannel(account, {
                type: NotificationChannelType.EMAIL,
                config: {
                    recipientAddress,
                },
            });

            // Sending a success response
            res.sendStatus(200);
        } catch (e) {
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Defining a route to handle GET requests for fetching notification channels
    router.get('/:ensName', async (req, res, next) => {
        try {
            const account = normalizeEnsName(req.params.ensName);

            // Getting notification channels for a user from the database
            const notificationChannels =
                await req.app.locals.db.getUsersNotificationChannels(account);

            // Sending the fetched notification channels as a JSON response
            res.json(notificationChannels);
        } catch (e) {
            // Passing the error to the next middleware
            next(e);
        }
    });

    // Returning the configured router
    return router;
};
