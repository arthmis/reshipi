# RE·SHI·PI
This website a simple recipe manager that allows you to add, update, delete and search your recipes.

## Demo
You can view a demo at [this link](https://arthmis.github.io/projects/#reshipi).

## Building
The system used is Ubuntu 18.04, therefore all dependency installation instructions will be based on this.

There are a few requirements to run this project. You will need to have Postgres 10 and Elasticsearch. Follow these instructions to install [Postgres 10](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-18-04). Follow these instructions to install [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/deb.html) on Ubuntu (I will move all the dependencies to Docker in the future).  

Now we will setup the necessary databases and tables in Postgres. You should have `psql` installed. With that you can perform the following commands

```
    psql -c "CREATE ROLE reshipi WITH SUPERUSER CREATEDB LOGIN PASSWORD 'postgres';" -U postgres -h localhost -p 5432 -w
    psql -c 'CREATE DATABASE reshipi;' -U postgres -h localhost -p 5432 -w
    psql -c 'ALTER DATABASE reshipi OWNER to reshipi;' -U postgres -h localhost -p 5432 -w
```

This will create a superuser role that will have ownership of the `reshipi` database. The next commands will create the database and transfer ownership from postgres to reshipi user. Create a `.env` file at the root of the folder with the following content.

```
    TESTING_DATABASE_URL=postgresql://testdb:postgres@localhost:5432/reshipi_test
    DATABASE_URL=postgresql://reshipi:postgres@localhost:5432/reshipi
    SECRET=secret
    NODE_ENV=development
```

Now all external dependencies should be setup. The final dependency is Nodejs. You will need version 12 and npm installed.

To build and run, cd into reshipi-frontend and run 
```
    npm install
    npm run build 
```
Go back to the root of the project and run
```
    npm install
    npm run dev
```

Go to `localhost:8000` on your web browser to enter the website. From here, you can create your own reshipi account and add, update, delete and search recipes. If these instructions don't lead to a working app then please let me know.