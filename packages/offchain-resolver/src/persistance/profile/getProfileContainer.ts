import { PrismaClient } from '@prisma/client';
import { UserProfile } from 'dm3-lib-profile';
import { ethers } from 'ethers';
import { getProfileContainerForAlias } from './getProfileContainerForAlias';
import { SignedUserProfile } from 'dm3-lib-profile';

export type ProfileContainer = {
    id: string;
    nameHash: string;
    profile: SignedUserProfile;
    ensName: string;
    address: string;
};

export function getProfileContainer(db: PrismaClient) {
    return async (name: string) => {
        const profileContainer = await db.profileContainer.findUnique({
            where: {
                nameHash: ethers.utils.namehash(name),
            },
        });

        if (profileContainer) {
            const profileContainerResult =
                profileContainer && profileContainer.profile
                    ? {
                          ...profileContainer,
                          profile: JSON.parse(
                              profileContainer.profile.toString(),
                          ) as SignedUserProfile,
                      }
                    : null;
            global.logger.debug({
                message: 'getProfileContainer',
                nameHash: ethers.utils.namehash(name),
                profileContainerResult,
            });

            return profileContainerResult;
        } else {
            global.logger.debug({
                message: 'getProfileContainer',
                nameHash: ethers.utils.namehash(name),
            });
            // try to find an alias which equlas name
            return await getProfileContainerForAlias(db)(name);
        }
    };
}
