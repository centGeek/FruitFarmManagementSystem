create table user_profile
(
    user_id      serial primary key,
    name         varchar(64)  not null,
    surname      varchar(64)  not null,
    nickname     varchar(64),
    phone_number varchar(64),
    email        varchar(255) not null,
    creation_date   date      not null,
    password     varchar(255) not null,
    role_id      int          not null,
    is_active    boolean      not null,
    gardener_id  int,
        CONSTRAINT fk_role
        FOREIGN KEY (role_id)
        REFERENCES role (role_id)
);