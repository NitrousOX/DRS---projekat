from marshmallow import Schema, fields, validate

class UserRegistrationSchema(Schema):
    first_name = fields.Str(required=True, validate=validate.Length(min=1))
    last_name = fields.Str(required=True, validate=validate.Length(min=1))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    birth_date = fields.Date(required=True)
    gender = fields.Str(required=True)
    country = fields.Str(required=True)
    street = fields.Str(required=True)
    street_number = fields.Str(required=True)

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class UserResponseSchema(Schema):
    id = fields.Int()
    first_name = fields.Str()
    last_name = fields.Str()
    email = fields.Email()
    role = fields.Str()
    profile_image = fields.Str()
