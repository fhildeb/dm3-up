import './Chat.css';
import { Message } from '../Message/Message';
import { getConversation } from 'dm3-lib-storage';
import { globalConfig, log } from 'dm3-lib-shared';
import { MessageProps } from '../../interfaces/props';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../../utils/context-utils';
import { MessageInputBox } from '../MessageInputBox/MessageInputBox';
import ConfigProfileAlertBox from '../ContactProfileAlertBox/ContactProfileAlertBox';
import {
    checkUserProfileConfigured,
    handleMessages,
    scrollToBottomOfChat,
} from './bl';
import { MessageActionType } from '../../utils/enum-type-utils';

export function Chat() {
    const { state, dispatch } = useContext(GlobalContext);

    const [messageList, setMessageList] = useState<MessageProps[]>([]);
    const [isMessageListInitialized, setIsMessageListInitialized] =
        useState<boolean>(false);
    const [isProfileConfigured, setIsProfileConfigured] =
        useState<boolean>(false);
    const [showShimEffect, setShowShimEffect] = useState(true);

    const alias =
        state.connection.ethAddress &&
        state.connection.ethAddress + globalConfig.ADDR_ENS_SUBDOMAIN();

    const setProfileCheck = (status: boolean) => {
        setIsProfileConfigured(status);
    };

    const updateShowShimEffect = (action: boolean) => {
        setShowShimEffect(action);
    };

    const setListOfMessages = (msgs: []) => {
        setMessageList(msgs);
    };

    const updateIsMessageListInitialized = (action: boolean) => {
        setIsMessageListInitialized(action);
    };

    useEffect(() => {
        setIsMessageListInitialized(false);
    }, [state.accounts.selectedContact]);

    // handles messages list
    useEffect(() => {
        setIsProfileConfigured(true);
        // fetch the messages from local storage is exists
        if (state.accounts.selectedContact) {
            const msgDetails = localStorage.getItem(
                state.accounts.selectedContact?.account.ensName,
            );
            if (msgDetails) {
                setShowShimEffect(false);
                setListOfMessages(JSON.parse(msgDetails));
            } else {
                setShowShimEffect(true);
            }
        }

        checkUserProfileConfigured(
            state,
            state.accounts.selectedContact?.account.ensName as string,
            setProfileCheck,
        );
        if (
            state.accounts.selectedContact &&
            state.userDb &&
            state.accounts.contacts
        ) {
            try {
                handleMessages(
                    state,
                    dispatch,
                    getConversation(
                        state.accounts.selectedContact.account.ensName,
                        state.accounts.contacts.map(
                            (contact) => contact.account,
                        ),
                        state.userDb,
                    ),
                    alias,
                    setListOfMessages,
                    isMessageListInitialized,
                    updateIsMessageListInitialized,
                    updateShowShimEffect,
                );
            } catch (error) {
                setShowShimEffect(false);
                setListOfMessages([]);
                log(error, 'error');
            }
        }
    }, [state.userDb?.conversations, state.accounts.selectedContact]);

    useEffect(() => {
        if (
            messageList.length &&
            (state.modal.lastMessageAction === MessageActionType.NONE ||
                state.modal.lastMessageAction === MessageActionType.REPLY ||
                state.modal.lastMessageAction === MessageActionType.NEW)
        ) {
            scrollToBottomOfChat();
        }
    }, [messageList]);

    useEffect(() => {
        checkUserProfileConfigured(
            state,
            state.accounts.selectedContact?.account.ensName as string,
            setProfileCheck,
        );
    }, [state.modal.addConversation.active]);

    /* shimmer effect contacts css */
    const shimmerData: number[] = Array.from({ length: 50 }, (_, i) => i + 1);

    return (
        <div
            className={
                state.accounts.selectedContact
                    ? 'highlight-chat-border'
                    : 'highlight-chat-border-none'
            }
        >
            {/* Shimmer effect while messages are loading */}
            {showShimEffect && (
                <div
                    id="chat-box"
                    className={
                        'chat-items position-relative mb-2 skeletion-chat-height'
                    }
                >
                    {shimmerData.map((item, index) => {
                        return (
                            <span
                                key={index}
                                className={'text-primary-color d-grid msg'.concat(
                                    ' ',
                                    index % 2
                                        ? 'me-2 justify-content-end'
                                        : 'ms-2 justify-content-start',
                                )}
                            >
                                <div className="d-flex">
                                    <div
                                        className="width-fill text-left font-size-14 border-radius-6 content-style 
                                        ms-3 background-config-box skeleton-message"
                                    ></div>
                                </div>
                            </span>
                        );
                    })}
                </div>
            )}

            {!showShimEffect && (
                <div className="m-2 text-primary-color position-relative chat-container">
                    {/* To show information box that contact has not created profile */}
                    {!isProfileConfigured && <ConfigProfileAlertBox />}

                    {/* Chat messages */}
                    <div
                        id="chat-box"
                        className={'chat-items position-relative mb-2'.concat(
                            ' ',
                            !isProfileConfigured
                                ? 'chat-height-small'
                                : 'chat-height-high',
                        )}
                    >
                        {messageList.length > 0 &&
                            messageList.map(
                                (messageData: MessageProps, index) => (
                                    <div key={index} className="mt-2">
                                        <Message {...messageData} />
                                    </div>
                                ),
                            )}
                    </div>

                    {/* Message, emoji and file attachments */}
                    <MessageInputBox />
                </div>
            )}
        </div>
    );
}
