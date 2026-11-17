CREATE DATABASE SecurityDB;

USE SecurityDB;

CREATE TABLE Student (
    Student_ID INT PRIMARY KEY,
    Student_Name VARCHAR(100),
    Department VARCHAR(50),
    Email VARCHAR(100),
    Phone VARCHAR(15)
);

INSERT INTO Student VALUES
(101, 'Ravi', 'CSE', 'ravi@college.edu', '9876543210'),
(102, 'Priya', 'CSE', 'priya@college.edu', '9876543211'),
(103, 'Arun', 'ECE', 'arun@college.edu', '9876543212'),
(104, 'Sita', 'AI', 'sita@college.edu', '9876543213');

CREATE USER 'db_reader'@'localhost'
IDENTIFIED BY 'Reader@123';

CREATE USER 'db_writer'@'localhost'
IDENTIFIED BY 'Writer@123';

CREATE USER 'db_admin'@'localhost'
IDENTIFIED BY 'Admin@123';

SELECT USER();

SELECT CURRENT_USER();

GRANT SELECT
ON SecurityDB.Student
TO 'db_reader'@'localhost';

USE SecurityDB;

SELECT * FROM Student;

INSERT INTO Student
VALUES (105, 'Kiran', 'CSE', 'kiran@college.edu', '9876543214');

GRANT SELECT, INSERT, UPDATE
ON SecurityDB.Student
TO 'db_writer'@'localhost';

SELECT * FROM SecurityDB.Student;

INSERT INTO SecurityDB.Student
VALUES (105, 'Kiran', 'CSE', 'kiran@college.edu', '9876543214');

UPDATE SecurityDB.Student
SET Department = 'AI'
WHERE Student_ID = 105;

DELETE FROM SecurityDB.Student
WHERE Student_ID = 105;

GRANT DELETE
ON SecurityDB.Student
TO 'db_writer'@'localhost';

DELETE FROM SecurityDB.Student
WHERE Student_ID = 105;

SHOW GRANTS FOR 'db_reader'@'localhost';

SHOW GRANTS FOR 'db_writer'@'localhost';

REVOKE DELETE
ON SecurityDB.Student
FROM 'db_writer'@'localhost';

SHOW GRANTS FOR 'db_writer'@'localhost';

CREATE ROLE 'student_reader';

GRANT SELECT
ON SecurityDB.Student
TO 'student_reader';

CREATE ROLE 'faculty_role';

GRANT SELECT, INSERT, UPDATE
ON SecurityDB.Student
TO 'faculty_role';

CREATE USER 'student_user'@'localhost'
IDENTIFIED BY 'Student@123';

GRANT 'student_reader'
TO 'student_user'@'localhost';

SET DEFAULT ROLE 'student_reader'
TO 'student_user'@'localhost';

CREATE VIEW Student_Public AS
SELECT
    Student_ID,
    Student_Name,
    Department
FROM Student;

GRANT SELECT
ON SecurityDB.Student_Public
TO 'student_user'@'localhost';

SELECT * FROM Student_Public;

SELECT VALIDATE_PASSWORD_STRENGTH('Password123!');

ALTER USER 'db_reader'@'localhost'
IDENTIFIED BY 'NewReader@456';

DROP USER 'db_reader'@'localhost';

INSERT INTO SecurityDB.Student
VALUES (106, 'Test', 'CSE', 'test@college.edu', '9999999999');

UPDATE SecurityDB.Student
SET Department = 'ECE'
WHERE Student_ID = 101;

SELECT * FROM SecurityDB.Student;