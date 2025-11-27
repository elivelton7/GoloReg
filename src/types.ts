export interface Field {
    id: string;
    code: string;
    description: string;
    createdAt: string;
}

export interface Player {
    id: string;
    name: string;
    roles: ('GK' | 'FIELD')[];
    fieldId: string;
    active: boolean;
    createdAt: string;
}

export interface GameEvent {
    id: string;
    playerId: string;
    type: 'GOAL' | 'ASSIST' | 'SAVE' | 'FOUL';
    timestamp: number;
}

export interface Contact {
    id: string;
    playerId: string;
    email: string | null;
    phone: string | null;
    createdAt: string;
}
