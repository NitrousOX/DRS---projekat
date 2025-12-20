class StatusCodes:
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    CONFLICT = 409
    INTERNAL_SERVER_ERROR = 500



class ApiResponse:
    def __init__(self, value, status_code):
        self.value = value
        self.status_code = status_code

    def to_dict(self):
        return {"value": self.value, "status_code": self.status_code}
