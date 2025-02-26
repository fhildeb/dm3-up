// To support images with extensions png, jpg, svg and gif
declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.svg';

declare module 'localforage' {
    let localforage: LocalForage;
    export = localforage;
}
