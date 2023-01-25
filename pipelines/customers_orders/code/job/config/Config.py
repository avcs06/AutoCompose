from prophecy.config import ConfigBase


class Config(ConfigBase):

    def __init__(self, test1: bool=None, test2: float=None, test3: str=None, test4: str=None, t5: str=None):
        self.spark = None
        self.update(test1, test2, test3, test4, t5)

    def update(self, test1: bool=True, test2: float=12312.0, test3: str="sdfsdfsd", test4: str="t4", t5: str="t5"):
        self.test1 = self.get_bool_value(test1)
        self.test2 = self.get_float_value(test2)
        self.test3 = test3
        self.test4 = test4
        self.t5 = t5
        pass
