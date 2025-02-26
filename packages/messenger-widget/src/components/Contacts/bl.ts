import {
    normalizeEnsName,
    getAccountDisplayName,
    getUserProfile,
} from 'dm3-lib-profile';
import { UserDB, getConversation } from 'dm3-lib-storage';
import { ContactPreview } from '../../interfaces/utils';
import {
    AccountsType,
    Actions,
    CacheType,
    GlobalState,
    ModalStateType,
    RightViewSelected,
    UiViewStateType,
} from '../../utils/enum-type-utils';
import { Contact } from '../../interfaces/context';
import { getAvatarProfilePic } from '../../utils/ens-utils';
import { closeLoader, startLoader } from '../Loader/Loader';

export const onContactSelected = (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    contact: Contact,
) => {
    // set selected contact
    dispatch({
        type: AccountsType.SetSelectedContact,
        payload: contact,
    });

    if (state.uiView.selectedRightView !== RightViewSelected.Chat) {
        // show chat screen
        dispatch({
            type: UiViewStateType.SetSelectedRightView,
            payload: RightViewSelected.Chat,
        });
    }
};

// sets height of the left view according to content
export const setContactHeightToMaximum = (isProfileConfigured: boolean) => {
    const element = document.getElementsByClassName(
        'contacts-scroller',
    )[0] as HTMLElement;
    element.style.height = isProfileConfigured ? '76vh' : '88vh';
};

// fetches contact list and sets data according to view on UI
export const fetchAndSetContacts = async (
    state: GlobalState,
): Promise<ContactPreview[]> => {
    const actualContactList: ContactPreview[] = [];

    // fetch contacts list
    const contactList = state.accounts.contacts
        ? state.accounts.contacts.filter(
              (contact) =>
                  !state.userDb?.hiddenContacts.find(
                      (hiddenContact) =>
                          normalizeEnsName(hiddenContact.ensName) ===
                          normalizeEnsName(contact.account.ensName),
                  ),
          )
        : [];

    if (contactList.length) {
        // iterate each record and set data fetched from provider
        for (const contact of contactList) {
            actualContactList.push({
                name: getAccountDisplayName(contact.account.ensName, 25),
                message: getMessagesFromUser(
                    contact.account.ensName,
                    state.userDb as UserDB,
                    contactList,
                ),
                image: await getAvatarProfilePic(
                    state,
                    contact.account.ensName,
                ),
                contactDetails: contact,
            });
        }
    }

    const profileAccounts = actualContactList.filter(
        (item) => item.contactDetails.account.profileSignature,
    );

    const nonProfileAccounts = actualContactList.filter(
        (item) => !item.contactDetails.account.profileSignature,
    );

    const uniqueProfileAccounts = [
        ...new Map(
            profileAccounts.map((item) => [
                item.contactDetails.account.profileSignature,
                item,
            ]),
        ).values(),
    ];

    const uniqueContacts = [...uniqueProfileAccounts, ...nonProfileAccounts];

    return uniqueContacts;
};

export const getMessagesFromUser = (
    ensName: string,
    userDB: UserDB,
    contacts: Contact[],
): string | null => {
    const messages = getConversation(
        ensName,
        contacts.map((contact) => contact.account),
        userDB,
    );

    if (messages.length) {
        const value = messages[messages.length - 1].envelop.message.message;
        return value ? value : null;
    }

    return null;
};

export const setContactIndexSelectedFromCache = (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    cacheContacts: ContactPreview[],
): number | null => {
    // start loader
    dispatch({
        type: ModalStateType.LoaderContent,
        payload: 'Fetching contacts...',
    });
    startLoader();

    const key =
        state.accounts.selectedContact?.account.profile?.publicEncryptionKey;
    const name = state.accounts.selectedContact?.account.ensName;

    const index = cacheContacts.findIndex(
        (data) =>
            (key &&
                data.contactDetails.account.profile?.publicEncryptionKey ===
                    key) ||
            name === data.contactDetails.account.ensName,
    );

    // close the loader
    closeLoader();

    return index > -1 ? index : null;
};

// fetches and sets contact
export const setContactList = async (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    setListOfContacts: Function,
) => {
    const cacheList = state.cache.contacts;
    if (cacheList && cacheList.length) {
        setListOfContacts(cacheList);
    } else {
        const data: ContactPreview[] = await fetchAndSetContacts(state);
        dispatch({
            type: CacheType.Contacts,
            payload: data,
        });
        setListOfContacts(data);
    }
};

export const updateSelectedContact = (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    setContactFromList: Function,
) => {
    if (state.cache.contacts) {
        const index = state.cache.contacts?.length - 1;
        dispatch({
            type: AccountsType.SetSelectedContact,
            payload: state.cache.contacts[index].contactDetails,
        });
        setContactFromList(index);
        const stateData = state.modal.addConversation;
        stateData.processed = true;
        dispatch({
            type: ModalStateType.AddConversationData,
            payload: stateData,
        });
    }
};

const fetchesUserProfile = async (ensName: string, state: GlobalState) => {
    try {
        return await getUserProfile(state.connection.provider!, ensName);
    } catch (error) {
        return null;
    }
};

// updates contact list on account change when new contact is added
export const updateContactOnAccountChange = async (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    contacts: ContactPreview[],
    setListOfContacts: Function,
    setContactFromList: Function,
) => {
    if (state.accounts.contacts) {
        // filter out the new conversation added
        const itemList = state.accounts.contacts.filter(
            (data) =>
                data.account.ensName === state.modal.addConversation.ensName,
        );

        if (itemList.length && state.cache.contacts) {
            // fetch last added contact
            const lastIndex = state.cache.contacts.length - 1;
            const items = [...state.cache.contacts];
            const item = { ...items[lastIndex] };

            const profile = await fetchesUserProfile(
                state.modal.addConversation.ensName as string,
                state,
            );

            const profileDetails = await Promise.all(
                state.cache.contacts.map(async (data, index) => {
                    return {
                        sign: await fetchesUserProfile(
                            data.contactDetails.account.ensName,
                            state,
                        ),
                        index: index,
                    };
                }),
            );

            const duplicateContact = profileDetails.filter(
                (data: any) =>
                    data.sign &&
                    profile &&
                    data.sign.signature === profile.signature,
            );

            if (duplicateContact.length > 1) {
                // remove last item
                const newList = [...contacts];
                newList.pop();

                // update contact list
                setListOfContacts(newList);

                // update cached contact list
                dispatch({
                    type: CacheType.Contacts,
                    payload: newList,
                });

                // select the already existing contact
                setContactFromList(duplicateContact[0].index);
            } else {
                // update the contact details
                item.contactDetails = itemList[0];
                item.message = getMessagesFromUser(
                    state.modal.addConversation.ensName as string,
                    state.userDb as UserDB,
                    state.accounts.contacts,
                );
                item.image = await getAvatarProfilePic(
                    state,
                    state.modal.addConversation.ensName as string,
                );
                items[lastIndex] = item;

                // update cached contact list
                dispatch({
                    type: CacheType.Contacts,
                    payload: items,
                });

                // update the current contact list
                const newList = [...contacts];
                newList[lastIndex] = item;
                setListOfContacts(newList);
            }

            // update the modal data as conversation is added
            const stateData = state.modal.addConversation;
            stateData.active = false;
            stateData.processed = false;
            dispatch({
                type: ModalStateType.AddConversationData,
                payload: stateData,
            });
        }
    }
};

// reset's the contact list on hiding any contact
export const resetContactListOnHide = (
    state: GlobalState,
    dispatch: React.Dispatch<Actions>,
    setListOfContacts: Function,
) => {
    if (state.modal.contactToHide) {
        const cachedContactList = state.cache.contacts?.filter(
            (data) =>
                data.contactDetails.account.ensName !==
                state.modal.contactToHide,
        );

        dispatch({
            type: CacheType.Contacts,
            payload: cachedContactList as [],
        });

        setListOfContacts(cachedContactList);

        dispatch({
            type: ModalStateType.ContactToHide,
            payload: undefined,
        });
    }
};

export const showMenuInBottom = (index: number | null): boolean => {
    const scroller: HTMLElement = document.getElementById(
        'chat-scroller',
    ) as HTMLElement;
    if (index != null && scroller) {
        const contact: HTMLElement = document.getElementById(
            `chat-item-id-${index}`,
        ) as HTMLElement;
        if (contact) {
            const scrollerBottom: number =
                scroller.getBoundingClientRect().bottom;
            const contactBottom: number =
                contact.getBoundingClientRect().bottom;
            return scrollerBottom - contactBottom >= 156 ? true : false;
        }
    }
    return true;
};
