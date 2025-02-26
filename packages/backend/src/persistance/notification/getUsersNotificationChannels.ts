import { NotificationChannel } from 'dm3-lib-delivery';
import { Redis, RedisPrefix } from '../getDatabase';
import { getIdEnsName } from '../getIdEnsName';

export function getUsersNotificationChannels(redis: Redis) {
    return async (ensName: string): Promise<NotificationChannel[]> => {
        const notifationChannels = await redis.get(
            RedisPrefix.NotificationChannel +
                (await getIdEnsName(redis)(ensName)),
        );
        return notifationChannels
            ? (JSON.parse(notifationChannels) as NotificationChannel[])
            : [];
    };
}
