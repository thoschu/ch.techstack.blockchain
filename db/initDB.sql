CREATE DATABASE 'Blockchain';

USE 'Blockchain';

CREATE TABLE User (
  id INT NOT NULL AUTO_INCREMENT,
  username varchar(255) DEFAULT NULL,
  password varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4;

INSERT INTO User (username, password) VALUES ('thoschu', 'password');

