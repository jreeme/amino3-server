## Using 'curl' to query the Merlin Application Platform: Elasticsearch Query API (v.1.0)
This document is intended as a quick reference for issuing queries to the Elasticsearch Query component of the Merlin Application
Platform (MAP) from a shell console using the 'curl' http query utility. It is heavy on 'cut and paste' examples demonstrating the
usage of the most common API calls (e.g. - creating users and roles, assigning roles to users, issuing a query to an Elasticsearch
cluster using the [Elasticsearch Query Domain Specific Language (Query DSL)](https://www.elastic.co/guide/en/elasticsearch/reference/current/_introducing_the_query_language.html)
## Getting Started
Using this document effectively requires access and authorization to use a Merlin Application Platform. These platforms appear
to users as domain URIs (including ports) that respond to HTTP/S requests. Because adding users and roles to a MAP are administrative
functions elevated rights to the MAP will be needed.
### Prerequisites
Following the examples below will require a computer with network access to a MAP that has the 'curl' utility installed. A typical
Linux installation having a 'bash' shell is typically sufficient. If building one from scratch [Ubuntu 18.04](https://www.ubuntu.com/download/desktop)
is known to work well.
## The 'curl' examples
The MAP supports controlled access to itself through an implmentation of an [OpenAPI 2.0 ReST](https://swagger.io) interface. The
particular implementation used is provided by [LoopBack 3.0](https://loopback.io). LoopBack provides a nice web application to issue
requests to this API which may or may not be available on a MAP installation depending on local site policies. If available this
is usually the easiest way to manually interact with the API.

Here we will be using 'curl' to issue HTTP requests complete with custom headers and POST buffers to demonstrate some common MAP
operations around user management and Elasticsearch queries.

All APIs provided by the MAP are protected by a role based security scheme. Individual users are assigned roles based on the level
of access they require. To facilitate this security paradigm a user is required to ask the MAP for a *token* to be included in any
subsequent API calls. At the time of this writing the *token* is implemented as a [JSON Web Token](https://jwt.io/) with a Time To
Live (TTL) of 1 hour. These details are subject to change. The aquisition of a *token* is itself an API call which (again at the
time of this writing, also subject to change) requires only a user name and password. For this reason a user must be registered
with the MAP in order to use it.
#### Default User and Groups
New installations of the MAP come with an administrative user called 'root' and the two roles 'superuser' and 'elasticsearch.'
There is a single role mapping of 'superuser' to 'root.' 'root' and 'superuser' cannot be deleted to ensure continued administrative
access to the MAP. All other user, role, and role mapping objects can be deleted (including 'elasticsearch').

The following 'curl' exercises assume access to the 'root' user's password.
### Logging into the MAP as 'root'
```bash
curl -X POST
--header 'Content-Type: application/json'
--header 'Accept: application/json'
-d '{"username":"root","password":"<root-password>"}'
'http://<fqdn>:<port>/amino-api/AminoUsers/login'

Response:

{
  "id": "<token-string>",
  "ttl": 3600,
  "created": "2018-05-09T17:42:13.016Z",
  "userId": 1
}
```
### Adding a user
```bash
curl -X POST
--header 'Content-Type: application/json'
--header 'Accept: application/json'
-d '{
   "firstname": "elasticsearch",
   "lastname": "user",
   "description": "ElasticSearch User",
   "username": "esuser",
   "email": "esuser%40genomi.org",
   "password":"<new-user-password>"
}'
'http://<fqdn>:<port>/amino-api/AminoUsers?access_token=<token-string>'

Response:

{
  "firstname": "elasticsearch",
  "lastname": "user",
  "description": "ElasticSearch User",
  "username": "esuser",
  "email": "esuser@genomi.org",
  "id": 3
}
```
### Adding a role
```bash
curl -X POST
--header 'Content-Type: application/json'
--header 'Accept: application/json'
-d '{
   "name": "reports",
   "description": "Allowed to generate reports"
}'
'http://<fqdn>:<port>/amino-api/Roles?access_token=<token-string>'

Response:

{
  "name": "reports",
  "description": "Allowed to generate reports",
  "created": "2018-05-09T18:05:55.130Z",
  "modified": "2018-05-09T18:05:55.130Z"
  "id": 3
}
```
### Assigning a role to a user (built in role 'elasticsearch' to user 'esuser')
```bash
# First, get 'id' of role 'elasticsearch'

curl -X GET
--header 'Accept: application/json'
'http://<fqdn>:<port>/amino-api/Roles?access_token=<token-string>?filter={"where":{"name":"elasticsearch"}}'

Response:

[
  {
    "id": 2,
    "name": "elasticsearch",
    "description": null,
    "created": "2018-05-09T15:07:21.130Z",
    "modified": "2018-05-09T15:07:21.130Z"
  }
]

# Next, use 'id' of role 'elasticsearch' in call to create role mapping

curl -X POST
--header 'Content-Type: application/json'
--header 'Accept: application/json'
-d '{
  "principalType": "USER",
  "principalId": "esuser",
  "roleId": 2
}'
'http://<fqdn>:<port>/amino-api/RoleMappings?access_token=<token-string>'

Response:

{
  "id": 3,
  "principalType": "USER",
  "principalId": "esuser",
  "roleId": 2
}
```
### Elasticsearch Query (using token of logged in 'esuser' or built in 'elasticsearch' user)
```bash
curl -X POST
--header 'Content-Type: application/json'
--header 'Accept: application/json'
-d '{
  "query":{
    "match":{
      "attachment.content":"Miami"
    }
  },
  "_source":{
    "excludes":["attachment.content", "file"]
  },
  "highlight":{
    "fields":{
      "attachment.content" : {}
    }
  }
}'
'http://<fqdn>:<port>:3000/amino-api/Elasticsearches/es/_search?access_token=<token-string>'

Response:

{
"... elasticsearch response ..."
}
```
## Authors
* **John Reeme** - *Initial work* - [email](mailto:john.reeme@keywcorp.com)
## License
UNLICENSED
